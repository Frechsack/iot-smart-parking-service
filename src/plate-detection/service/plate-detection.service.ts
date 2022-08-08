import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { DetectedLicensePlate } from '../detected-license-plate';
import { exec, ChildProcess } from 'child_process';
import { LicensePlatePhotoTypeName, valueOf } from 'src/orm/entity/license-plate-photo-type';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { LicensePlateStatusRepository } from 'src/orm/repository/license-plate-status.repository';
import { access } from 'fs/promises';
import { Mutex } from 'async-mutex';

@Injectable()
export class PlateDetectionService {

  private readonly detectedPlatesSource = new Subject<DetectedLicensePlate>();

  public readonly detectedPlates = this.detectedPlatesSource.asObservable();

  private readonly childProcessMap = new Map<LicensePlatePhotoTypeName,ChildProcess>();

  private readonly videoDevicesMap = new Map<LicensePlatePhotoTypeName,string>();

  private readonly lastLicensePlateMap = new Map<LicensePlatePhotoTypeName,string>();

  private readonly mutexMap = new Map<LicensePlatePhotoTypeName,Map<string, Mutex>>();

  private readonly ignoreErrorMap = new Map<LicensePlatePhotoTypeName,number>();


  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly licensePlateStatusRepository: LicensePlateStatusRepository
   ){
    loggerService.context = PlateDetectionService.name;
    for(let processType in LicensePlatePhotoTypeName){
      const videoDevice = configService.get(`LICENSE_PLATE_RECOGNITION_DEVICE_${processType}`);
      if(videoDevice != null){
        const functionMap = new Map<string,Mutex>();
        functionMap.set('startProcess', new Mutex());
        functionMap.set('stopProcess', new Mutex());
        functionMap.set('processPossiblePlates', new Mutex());

        this.mutexMap.set(valueOf(processType), functionMap);
        this.ignoreErrorMap.set(valueOf(processType), 0);
        this.videoDevicesMap.set(valueOf(processType),videoDevice);
      }
      else {
        loggerService.warn(`Licenseplate recognition camera is missing, type: "${processType}"`);
      }
    }

    this.detectedPlates.subscribe(it => console.log(it));
    // Starte Erkennung für alle.
    this.videoDevicesMap.forEach((value, key) => this.startPlateRecognition(key));
  }

  private async isProcessRunning(process: LicensePlatePhotoTypeName): Promise<boolean> {
    const funIsProcessRunning = async (): Promise<boolean> => {
      if(this.isDockerUsed()){
        return new Promise<boolean>((resolve) => {
          exec(`sudo docker container ls -q --filter name=${this.getDockerContrainerName(process)}`, (error,stdout) => {
            if(error) resolve(false);
            if(stdout == '') resolve(false);
            return resolve(true);
          });
        });
      }
      else {
        if(!this.childProcessMap.has(process)) return false;
        const childProcess = this.childProcessMap.get(process)!;
        return childProcess.exitCode != null || !childProcess.killed;
      }
    }
    return await funIsProcessRunning();
  }

  private modIgnoreError(process: LicensePlatePhotoTypeName, mod: number): number{
    if(mod === 0) return this.ignoreErrorMap.get(process)!;
    mod = this.ignoreErrorMap.get(process)!; + mod;
    this.ignoreErrorMap.set(process, mod);
    return mod;
  }

  public isDockerUsed(): boolean {
    return this.configService.get<boolean>('LICENSE_PLATE_RECOGNITION_DOCKER', false);
  }

  private getConfidenceMin(): number {
    return this.configService.get<number>('LICENSE_PLATE_RECOGNITION_CONFIDENCE_MIN', 50);
  }

  private getSnapshotDirectory(): string {
    return this.configService.get<string>('LICENSE_PLATE_RECOGNITION_SNAPSHOT_PATH', '/tmp/');
  }

  private getDockerContrainerName(process: LicensePlatePhotoTypeName){
    return `iot-smart-parking-openalpr-process-${process.toLowerCase()}`;
  }

  private extractPossiblePlates(data: string): {licensePlate: string, confidence: number}[]{
    const CONFIDENCE_MIN = this.getConfidenceMin();

    // Format data:
    /**
    * plateX: N results
    *   - XXXXXXX    confidence: XX.XXXX
    *   - XXXXXXX    confidence: XX.XXXX
    *   - XXXXXXX    confidence: XX.XXXX
    */

    return data.split('\r\n')
    .map(it => it.trim())
    .filter(it => !it.startsWith('plate'))
    .filter(it => it.startsWith('-'))
    .map(it => {
      const licensePlateStart = 2;
      const licensePlateEnd = it.indexOf('\t', licensePlateStart);
      const confidenceStart = it.indexOf(':') + 1;
      const confidenceEnd = confidenceStart + 3;
      return {
        licensePlate: it.substring(licensePlateStart, licensePlateEnd),
        confidence: Number.parseInt(it.substring(confidenceStart, confidenceEnd))
      };
    })
    .filter(it => it.confidence >= CONFIDENCE_MIN);
  }

  private async processPossiblePlates(
    process: LicensePlatePhotoTypeName,
    plates: {licensePlate: string, confidence: number}[]
  ): Promise<void> {

    const VIDEO_DEVICE = this.videoDevicesMap.get(process)!;

    const funProcessPossiblePlates = async () => {
      for(const licensePlate of plates){
        // Doppelregistrieung verhindern --> Zwischenspeichern in Map.
        if(this.lastLicensePlateMap.get(process) === licensePlate.licensePlate) continue;
        // TODO: Evtl. lock für Zeit X.

        // Prüfe ob Kennzeichen in Datenbank
        if(!(await this.licensePlateRepository.existsByPlate(licensePlate.licensePlate))) continue;
        // Prüfe ob Zustand bereits bekannt
        const currentStatus = await this.licensePlateStatusRepository.findOneByPlate(licensePlate.licensePlate);
        if(currentStatus != null && currentStatus.status === process) continue;

        // Gültiges Kennzeichen --> Weiterverarbeitung
        this.loggerService.log(`Valid licensePlate detected, processType: "${process}", licensePlate: "${licensePlate.licensePlate}"`);

        // Stoppe Kennzeichenerkennung
        if(await this.isProcessRunning(process))
          await this.stopPlateRecognition(process);

        // Mache Snapshot
        try {
          const snapshotPath = await this.takeSnapshot(process,VIDEO_DEVICE);
          this.lastLicensePlateMap.set(process,licensePlate.licensePlate);
          this.detectedPlatesSource.next(new DetectedLicensePlate(licensePlate.licensePlate,snapshotPath,process));
        }
        catch (err){
          this.loggerService.error(`Taking snaphot failed, processType: "${process}", licensePlate: "${licensePlate.licensePlate}", error: "${err}"`);
        }
        finally {
          // Starte Kennzeichenerkennung erneut
          if(!(await this.isProcessRunning(process)))
            this.startPlateRecognition(process);
          return;
        }
      }
    }
    await this.mutexMap.get(process)!.get('processPossiblePlates')!.runExclusive(funProcessPossiblePlates);
  }


  private async startPlateRecognition(process: LicensePlatePhotoTypeName){
    // Das Gerät für diesen Prozess
    const videoDevice = this.videoDevicesMap.get(process)!;

    // Das Kommando um openalpr zu starten, je nach Konfiguration per Docker oder native.
    const command = this.isDockerUsed() ?
      `sudo docker run -t --rm --privileged --name ${this.getDockerContrainerName(process)} openalpr -n 2 -d -c eu ${videoDevice}` :
      `alpr -n 2 -d --motion -c eu ${videoDevice}`;

    // Funktion zum starten des Prozesses.
    const funStartPlateRecognition = async (): Promise<void> => {
      // Beende sollte Kennzeichenerkennung bereits laufen
      if(await this.isProcessRunning(process))
          await this.stopPlateRecognition(process);

      // Starte Prozess
      const childProcess = exec(command,async error => {
        // Der Prozess wurde fehlerhaft beendet
        if(error) {
          if(this.modIgnoreError(process,0) < 0){
            this.loggerService.error(`Licenseplate recognition failed, type: "${process}", error: "${error}"`);
            this.modIgnoreError(process,-this.modIgnoreError(process,0));
          }
          else
            this.modIgnoreError(process,-1);
        }
      });

      this.childProcessMap.set(process,childProcess);

      childProcess.stdout!.on('data', async data => {
        const plates = this.extractPossiblePlates(data);
        await this.processPossiblePlates(process,plates);
      });
    }
    await this.mutexMap.get(process)!.get('startProcess')!.runExclusive(funStartPlateRecognition);
  }

  private async stopPlateRecognition(process: LicensePlatePhotoTypeName): Promise<void> {
    const funStopPlateRecognition = async () => {
      return new Promise<void>(async (resolve, reject) => {
        if(this.isDockerUsed()){
          this.modIgnoreError(process,1);
          exec(`sudo docker container stop $(sudo docker container ls -q --filter name=${this.getDockerContrainerName(process)})`,() => {
            exec(`sudo docker container rm $(sudo docker container ls -q --filter name=${this.getDockerContrainerName(process)})`, () => {
              resolve();
            })
          });
        }
        else {
          this.modIgnoreError(process,1);
          this.childProcessMap.get(process)!.kill();
          resolve();
        }
      });
    }
    await this.mutexMap.get(process)!.get('stopProcess')?.runExclusive(funStopPlateRecognition);
  }


  private async takeSnapshot(process: LicensePlatePhotoTypeName,videoDevice: string): Promise<string> {
    const FAILED_ATTEMPTS_MAX = 2;

    const funTakeSnapshot = async (): Promise<string> => {
      let failedAttempts = 0;

      const existsFile = async (path: string): Promise<boolean> => {
        try {
          await access(path);
          return true;
        } catch {
          return false;
        }
      }

      const takeSnapshot = (): Promise<string> => {
        return new Promise(async (resolove,reject) => {
          const snapshotDir = this.getSnapshotDirectory();
          let filePath: string;
          do
            filePath = snapshotDir + Math.random() + '.png';
          while(await existsFile(filePath))
          exec(`fswebcam 1 -d ${videoDevice} -s 2 --png 1 -q ${filePath}`,(error) => {
            if(error) {
              reject(error);
            }else {
              resolove(filePath);
            }
          });
        });
      }

      while(failedAttempts <= FAILED_ATTEMPTS_MAX){
        try {
          return await takeSnapshot();
        }
        catch (error){
          if(failedAttempts == FAILED_ATTEMPTS_MAX)
            return Promise.reject(error);
          else
            failedAttempts++;
        }
      }
      return Promise.reject();
    }
    return await funTakeSnapshot();
  }
}

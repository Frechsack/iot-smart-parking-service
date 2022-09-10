import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { DetectedLicensePlate } from '../detected-license-plate';
import { exec, spawn, ChildProcess } from 'child_process';
import { LicensePlatePhotoTypeName, valueOf } from 'src/orm/entity/license-plate-photo-type';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { LicensePlateStatusRepository } from 'src/orm/repository/license-plate-status.repository';
const fs = require('fs').promises
import { Mutex } from 'async-mutex';
import { UtilService } from 'src/core/service/util.service';

const DETECTION_TIMEOUT_SECONDS = 10;

@Injectable()
export class PlateDetectionService {

  private readonly detectedPlatesSource = new Subject<DetectedLicensePlate>();

  /**
  * Pipe mit erkannten Kennzeichen.
  * Ein Kennzeichen wird erkannt wenn:
  * 1. Das Kennzeichen aktuell nicht eingecheckt ist.
  * 2. Das Parkhaus noch Kapazitäten hat.
  */
  public readonly detectedPlates = this.detectedPlatesSource.asObservable();

  private readonly childProcessMap = new Map<LicensePlatePhotoTypeName,ChildProcess>();

  private readonly videoDevicesMap = new Map<LicensePlatePhotoTypeName,string>();

  private readonly lastLicensePlateMap = new Map<LicensePlatePhotoTypeName,string>();

  private readonly mutexMap = new Map<LicensePlatePhotoTypeName,Map<string, Mutex>>();

  private readonly latestDetectionMap = new Map<LicensePlatePhotoTypeName,Date>();

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly licensePlateStatusRepository: LicensePlateStatusRepository,
    private readonly utilService: UtilService
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
        this.videoDevicesMap.set(valueOf(processType),videoDevice);
      }
      else {
        loggerService.warn(`Licenseplate recognition camera is missing, type: "${processType}"`);
      }
    }
    // Starte Erkennung für alle.
    this.videoDevicesMap.forEach((value, key) => this.startPlateRecognition(key));
  }

  private async isProcessRunning(process: LicensePlatePhotoTypeName): Promise<boolean> {
    const funIsProcessRunning = async (): Promise<boolean> => {
      if(this.isDockerUsed()){
        // Die Erkennung ob der Prozess läuft, muss über Docker geschehen.
        return new Promise<boolean>((resolve) => {
          exec(`sudo docker container ls -q --filter name=${this.getDockerContrainerName(process)}`, (error,stdout) => {
            if(error) resolve(false);
            if(stdout == '') resolve(false);
            return resolve(true);
          });
        });
      }
      else {
        // Die Erkennung ob der Prozess läuft, erfolgt primär darüber ob der Prozess in ChildMap ist.
        if(!this.childProcessMap.has(process)) return false;
        const childProcess = this.childProcessMap.get(process)!;
        console.log(childProcess.exitCode == null && !childProcess.killed);
        console.log(childProcess.pid);
        return childProcess.exitCode == null && !childProcess.killed;
      }
    }
    return await funIsProcessRunning();
  }

  public isDockerUsed(): boolean {
    const value = this.configService.get('LICENSE_PLATE_RECOGNITION_DOCKER', false);
    if(typeof value === 'boolean') return value;
    return value == 'true';
  }

  private getConfidenceMin(): number {
    const value = this.configService.get('LICENSE_PLATE_RECOGNITION_CONFIDENCE_MIN', 50);
    if(typeof value === 'number') return value;
    return Number(value);
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

  /**
  * Triggert manuel eine Kennzeichenerkennung bei Einfahrt. Dabei wird der reguläre Prozess durchlaufen.
  * Es kann nur ein Kennzeichen auf einem Prozess erkannt werden (ENTER, EXIT), für den eine Kammera hinterlegt wurde.
  * @param plate Das erkannte Kennzeichen.
  */
  public async enter(plate: string): Promise<void> {
    await this.processPossiblePlates(LicensePlatePhotoTypeName.ENTER,[{ confidence: 100, licensePlate: plate }]);
  }

  /**
  * Triggert manuel eine Kennzeichenerkennung bei Ausfahrt. Dabei wird der reguläre Prozess durchlaufen.
  * Es kann nur ein Kennzeichen auf einem Prozess erkannt werden (ENTER, EXIT), für den eine Kammera hinterlegt wurde.
  * @param plate Das erkannte Kennzeichen.
  */
  public async exit(plate: string): Promise<void> {
    await this.processPossiblePlates(LicensePlatePhotoTypeName.EXIT,[{ confidence: 100, licensePlate: plate }]);
  }

  private async processPossiblePlates(
    process: LicensePlatePhotoTypeName,
    plates: {licensePlate: string, confidence: number}[]
  ): Promise<void> {

    const VIDEO_DEVICE = this.videoDevicesMap.get(process)!;

    const funProcessPossiblePlates = async () => {

      // Nach erfolgreicher erkennung, muss die Erkennung für Zeit X deaktiviert werden.
      const latestDetection = this.latestDetectionMap.get(process);
      if(latestDetection !== undefined && (latestDetection.getTime() >= Date.now() - DETECTION_TIMEOUT_SECONDS * 1000))
        return;

      if(process === LicensePlatePhotoTypeName.ENTER){
        // Prüfe zuerst ob Parkhaus noch Kapazitäten übrig hat.
        // Wenn nicht darf Kennzeichen nicht erkannt werden.
        const isParkingLotAvailable = await this.utilService.countAvailableParkingLots();
        if(isParkingLotAvailable <= 0) {
          this.latestDetectionMap.set(process,new Date(Date.now()));
          this.loggerService.warn('Licenseplate detected, but no space available.');
          return;
        }
      }

      for(const licensePlate of plates){
        // Doppelregistrieung verhindern --> Zwischenspeichern in Map.
        if(this.lastLicensePlateMap.get(process) === licensePlate.licensePlate) continue;

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

        try {
          // Mache Snapshot
          const snapshotPath = await this.takeSnapshot(process,VIDEO_DEVICE);

          this.lastLicensePlateMap.set(process,licensePlate.licensePlate);

          // Sonderfälle: Bei Aus- und Einfahrt muss das Kennzeichen wieder für den anderen Prozess freigeschaltet werden
          const oppositeProcess = process === LicensePlatePhotoTypeName.ENTER
            ? LicensePlatePhotoTypeName.EXIT
            : LicensePlatePhotoTypeName.ENTER;
          const lastEnterLicensePlate = this.lastLicensePlateMap.get(oppositeProcess);
          if(lastEnterLicensePlate == licensePlate.licensePlate)
            this.lastLicensePlateMap.set(oppositeProcess,'');

          this.latestDetectionMap.set(process,new Date(Date.now()));
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
      let childProcess: ChildProcess
      if(this.isDockerUsed()){
          childProcess = spawn(command, { shell: true });
      }
      else {
        childProcess = spawn(command, { shell: true, detached: true });
      }

      /*exec(command,async error => {
        // Der Prozess wurde fehlerhaft beendet
        if(error) {
          if(this.modIgnoreError(process,0) < 0){
            this.loggerService.error(`Licenseplate recognition failed, type: "${process}", error: "${error}"`);
            this.modIgnoreError(process,-this.modIgnoreError(process,0));
          }
          else
            this.modIgnoreError(process,-1);
        }
      });*/

      this.childProcessMap.set(process,childProcess);

      childProcess.stdout!.on('data', async data => {
        if(data == null) return;
        data = data.toString();
        const plates = this.extractPossiblePlates(data);
        await this.processPossiblePlates(process,plates);
      });
    }
    await this.mutexMap.get(process)!.get('startProcess')!.runExclusive(funStartPlateRecognition);
  }

  private async stopPlateRecognition(p: LicensePlatePhotoTypeName): Promise<void> {
    const funStopPlateRecognition = async () => {
      return new Promise<void>(async (resolve, reject) => {
        if(this.isDockerUsed()){
          exec(`sudo docker container stop $(sudo docker container ls -q --filter name=${this.getDockerContrainerName(p)})`,() => {
            exec(`sudo docker container rm $(sudo docker container ls -q --filter name=${this.getDockerContrainerName(p)})`, () => {
              // Entferne den garantiert gestoppten Prozess aus ChildMap
              this.childProcessMap.delete(p);
              resolve();
            })
          });
        }
        else {
          process.kill(-this.childProcessMap.get(p)!.pid!);
          // Entferne den garantiert gestoppten Prozess aus ChildMap
          this.childProcessMap.delete(p);
          resolve();
        }
      });
    }
    await this.mutexMap.get(p)!.get('stopProcess')?.runExclusive(funStopPlateRecognition);
  }


  private async takeSnapshot(process: LicensePlatePhotoTypeName,videoDevice: string): Promise<string> {
    const FAILED_ATTEMPTS_MAX = 10;
    const TIMEOUT_PER_FAIL = 250;

    const funTakeSnapshot = async (): Promise<string> => {
      let failedAttempts = 0;

      const existsFile = async (path: string): Promise<boolean> => {
        try {
          await fs.access(path);
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
            filePath = snapshotDir + (Math.random() * 100).toFixed(0) + '.png';
          while(await existsFile(filePath))

          exec(`fswebcam -d ${videoDevice} --png 1 -q ${filePath}`,(error, stdout, stderr) => {
            if(error !== null || stderr !== '') {
              reject(error);
            }
            else {
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
          {
            this.loggerService.error('Execute of fswebcam failed.');
            return Promise.reject(error);
          }
          else{
            failedAttempts++;
            this.loggerService.warn(`Execute of fswebcam failed, next try in "${TIMEOUT_PER_FAIL} ms".`);
            // Warte 250 ms
            await new Promise<void>(resolve => setTimeout(() => resolve(),TIMEOUT_PER_FAIL));
          }
        }
      }
      return Promise.reject();
    }
    return await funTakeSnapshot();
  }
}

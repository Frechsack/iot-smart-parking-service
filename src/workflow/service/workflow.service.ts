import { Injectable } from '@nestjs/common';
import { CommunicationService } from 'src/core/service/communication.service';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { DetectedLicensePlate } from 'src/plate-detection/detected-license-plate';
import { PlateDetectionService } from 'src/plate-detection/service/plate-detection.service';
import { readFile, unlink } from 'fs';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlatePhotoRepository } from 'src/orm/repository/license-plate-photo.repository';
import { LicensePlatePhotoTypeRepository } from 'src/orm/repository/license-plate-photo-type.repository';
import { LicensePlatePhoto } from 'src/orm/entity/license-plate-photo';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { EntityManager } from 'typeorm';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { ParkingLotStatusRepository } from 'src/orm/repository/parking-lot-status.repository';
import { ParkingLotGuidingDevicesRepository } from 'src/orm/repository/parking-lot-guiding-devices.repository';
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { DeviceTypeName } from 'src/orm/entity/device-type';
import { UtilService } from 'src/core/service/util.service';

const PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS = 30;

@Injectable()
export class WorkflowService {

  private latestEnterWorkflowStart?: Date;

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly plateDetectionService: PlateDetectionService,
    private readonly licensePlatePhotoRepository: LicensePlatePhotoRepository,
    private readonly licensePlatePhotoTypeRepository: LicensePlatePhotoTypeRepository,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly parkingLotRepository: ParkingLotRepository,
    private readonly parkingLotStatusRepository: ParkingLotStatusRepository,
    private readonly loggerService: LoggerService,
    private readonly parkingLotGuidingDevicesRepository: ParkingLotGuidingDevicesRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly utilService: UtilService
  ){
    this.loggerService.context = WorkflowService.name;

    this.plateDetectionService.detectedPlates
    .subscribe(async it => {
      if(it.licensePlatePhotoType === LicensePlatePhotoTypeName.ENTER)
        this.startEnterWorkflow(it);
      else
        this.startExitWorkflow(it);
    });
  }

  public async startEnterWorkflow(plate: DetectedLicensePlate): Promise<void> {
    const transaction = async (manager: EntityManager): Promise<void> => {
      const licensePlateRepository = this.licensePlateRepository.forTransaction(manager);
      const licensePlatePhotoTypeRepository = this.licensePlatePhotoTypeRepository.forTransaction(manager);
      const parkingLotStatusRepository = this.parkingLotStatusRepository.forTransaction(manager);
      const deviceRepository = this.deviceRepository.forTransaction(manager);

      // Prüfe ob Parkplatz verfügbar
      const parkingLotStatus = await parkingLotStatusRepository.findFirstAvailable();
      if(parkingLotStatus == null){
        this.loggerService.error(`License-plate was detected, but no space is available, plate: "${plate.licensePlate}"`);
        // TODO: Evtl. reset-signal nach PlateDetectionService, damit Kennzeichen erneut erkannt werden kann.
        return;
      }

      // Bild auslesen & löschen
      this.loggerService.log('Enter-Workflow started.');
      let image = await this.readFile(plate.licensePlatePhotoPath);
      this.deleteFile(plate.licensePlatePhotoPath).catch();

      const licensePlate = await licensePlateRepository.findOneByPlate(plate.licensePlate);
      if(licensePlate == null)
        throw new Error(`License-plate does not exists, plate: "${plate.licensePlate}"`);

      // Speicher Bild in DB --> Dadurch wird Kennzeichen als eingecheckt makiert.
      let licensePlatePhoto = new LicensePlatePhoto();
      licensePlatePhoto.date = new Date();
      licensePlatePhoto.image = image;
      licensePlatePhoto.licensePlate = Promise.resolve(licensePlate);
      licensePlatePhoto.type = Promise.resolve((await licensePlatePhotoTypeRepository.findOneByName(LicensePlatePhotoTypeName.ENTER))!);
      licensePlatePhoto = await this.licensePlatePhotoRepository.save(licensePlatePhoto);

      // Starte Parkleitsystem für X-Sekunden
      const parkingLotGuideDevice = await this.parkingLotGuidingDevicesRepository.findOneByNr(parkingLotStatus.nr);
      if(parkingLotGuideDevice == null){
        this.loggerService.warn(`No parking-guide installed, parking-lot: "${parkingLotStatus.nr}"`);
        return;
      }

      this.loggerService.log(`Enable parking-guide-system, parking-lot: "${parkingLotStatus.nr}"`)

      // Gebe Anweisung Geräte einzuschalten
      this.enableParkingGuideSystem([ parkingLotGuideDevice.mac, ...parkingLotGuideDevice.parents ]);

      // Schalte Einfahrschranken
      const enterServos = await deviceRepository.findBy({ type: { name: DeviceTypeName.ENTER_BARRIER }});
      enterServos.forEach(it => this.utilService.openServoForInterval(it.mac,10));
    }

    await this.licensePlateRepository.runTransaction(transaction);
  }

  public async startExitWorkflow(plate: DetectedLicensePlate){
    const transaction = async (manager: EntityManager): Promise<void> => {
      const licensePlateRepository = this.licensePlateRepository.forTransaction(manager);
      const licensePlatePhotoTypeRepository = this.licensePlatePhotoTypeRepository.forTransaction(manager);
      const deviceRepository = this.deviceRepository.forTransaction(manager);

      // Bild auslesen & löschen
      this.loggerService.log('Exit-Workflow started.');
      let image = await this.readFile(plate.licensePlatePhotoPath);
      this.deleteFile(plate.licensePlatePhotoPath).catch();

      const licensePlate = await licensePlateRepository.findOneByPlate(plate.licensePlate);
      if(licensePlate == null)
        throw new Error(`License-plate does not exists, plate: "${plate.licensePlate}"`);

      // Speicher Bild in DB --> Dadurch wird Kennzeichen als ausgecheckt makiert.
      let licensePlatePhoto = new LicensePlatePhoto();
      licensePlatePhoto.date = new Date();
      licensePlatePhoto.image = image;
      licensePlatePhoto.licensePlate = Promise.resolve(licensePlate);
      licensePlatePhoto.type = Promise.resolve((await licensePlatePhotoTypeRepository.findOneByName(LicensePlatePhotoTypeName.EXIT))!);
      licensePlatePhoto = await this.licensePlatePhotoRepository.save(licensePlatePhoto);

      // Schalte Ausfahrschranken
      const enterServos = await deviceRepository.findBy({ type: { name: DeviceTypeName.EXIT_BARRIER }});
      enterServos.forEach(it => this.utilService.openServoForInterval(it.mac,10));
    };
    this.licensePlateRepository.runTransaction(transaction);
  }

  private async enableParkingGuideSystem(devices: string[]): Promise<void> {
    this.latestEnterWorkflowStart = new Date();
    // Deaktivierte alle bisherigen Parking-Guide-Lampen, muss erzwungen werden.
    await this.disableParkingGuideSystem(true);

    await Promise.all(devices.map(async it => await this.communicationService.sendInstruction(it,true)));

    // Request um Sensoren in Zukunft zu deaktivieren
    setTimeout(async () => this.disableParkingGuideSystem(), PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS * 1000);
  }

  private async disableParkingGuideSystem(isForced: boolean = false): Promise<void> {
    if(!isForced) {
      const latestStart = this.latestEnterWorkflowStart!.getTime();
      const end = latestStart + PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS * 1000;
      // Parkleitsystem läuft noch keine X Sekunden
      if(Date.now() <= end) return;
    }

    // Schalte alle Parkleitsystem-lampen ab
    const devices = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.PARKING_GUIDE_LAMP }});
    await Promise.all(devices.map(async it => await this.communicationService.sendInstruction(it.mac,false)));
  }

  private async deleteFile(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      unlink(path,(error) => {
        if(error) reject(error);
        else resolve();
      });
    });
  }

  private async readFile(path: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      readFile(path,(error,data) => {
        if(error) reject(error);
        else resolve(data);
      });
    });
  }
}

import { Injectable } from '@nestjs/common';
import { CommunicationService } from 'src/core/service/communication.service';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { DetectedLicensePlate } from 'src/plate-detection/detected-license-plate';
import { PlateDetectionService } from 'src/plate-detection/service/plate-detection.service';
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
import { Payment } from 'src/orm/entity/payment';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
import { filter } from 'rxjs';

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
    private readonly parkingLotStatusRepository: ParkingLotStatusRepository,
    private readonly loggerService: LoggerService,
    private readonly parkingLotGuidingDevicesRepository: ParkingLotGuidingDevicesRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly utilService: UtilService,
    private readonly paymentRepository: PaymentRepository
  ){
    this.loggerService.context = WorkflowService.name;

    // Gefundene Kennzeichen
    this.plateDetectionService.detectedPlates
    .subscribe(async it => {
      if(it.licensePlatePhotoType === LicensePlatePhotoTypeName.ENTER)
        this.startEnterWorkflow(it);
      else
        this.startExitWorkflow(it);
    });

    // Klimasteuerungsevent
    this.communicationService.statusLane
    .pipe(filter(it => it.isExternalMessage()))
    .subscribe(async it => {
      const device = await this.deviceRepository.findOneByMac(it.mac);
      if(device == null) return;
      if((await device.type).name !== DeviceTypeName.CWO_SENSOR) return;
      const status = it.status;
      const fans = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.FAN }});
      const alarms = await this.deviceRepository.findBy({ type : { name : DeviceTypeName.ALARM }});
      const barriers =
        [
         ...(await this.deviceRepository.findBy({ type: { name: DeviceTypeName.EXIT_BARRIER}})),
         ...(await this.deviceRepository.findBy({ type: { name: DeviceTypeName.ENTER_BARRIER}}))
       ];

      // TODO: Test ob Co2 zu hoch
      fans.forEach(it => this.communicationService.sendInstruction(it.mac, true));
      alarms.forEach(it => this.communicationService.sendInstruction(it.mac, true));
      barriers.forEach(it => this.communicationService.sendInstruction(it.mac, true));

      fans.forEach(it => this.communicationService.sendInstruction(it.mac, false));
      alarms.forEach(it => this.communicationService.sendInstruction(it.mac, false));
      barriers.forEach(it => this.communicationService.sendInstruction(it.mac, false));
    });

    // Initial display initialisieren
    setTimeout(() => this.synchronizeSpaceDisplays(), 2000);
  }

  /**
  * Startet den Workflow führ die Einfahrt eines erkannten Kennzeichens.
  * @param plate Das erkannte Kennzeichen inkl. Meta-Informationen der Kennzeichenerkennung.
  */
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
      let image: Buffer;
      try {
        image = await this.utilService.readFile(plate.licensePlatePhotoPath);
      }
      catch (error){
        this.loggerService.error(`File could not be read, error: "${error}"`);
        return;
      }

      this.utilService.deleteFile(plate.licensePlatePhotoPath).catch();

      const licensePlate = await licensePlateRepository.findOneByPlate(plate.licensePlate);
      if(licensePlate == null)
        throw new Error(`License-plate does not exists, plate: "${plate.licensePlate}"`);

      // Speicher Bild in DB --> Dadurch wird Kennzeichen als eingecheckt makiert.
      let licensePlatePhoto = new LicensePlatePhoto();
      licensePlatePhoto.date = new Date();
      licensePlatePhoto.image = image!;
      licensePlatePhoto.licensePlate = Promise.resolve(licensePlate);
      licensePlatePhoto.type = Promise.resolve((await licensePlatePhotoTypeRepository.findOneByName(LicensePlatePhotoTypeName.ENTER))!);
      licensePlatePhoto = await this.licensePlatePhotoRepository.save(licensePlatePhoto);

      // Update Displays
      this.synchronizeSpaceDisplays();

      // Starte Parkleitsystem für X-Sekunden
      const parkingLotGuideDevice = await this.parkingLotGuidingDevicesRepository.findOneByNr(parkingLotStatus.nr);
      if(parkingLotGuideDevice == null){
        this.loggerService.warn(`No parking-guide installed, parking-lot: "${parkingLotStatus.nr}"`);
      }
      else{
        this.loggerService.log(`Enable parking-guide-system, parking-lot: "${parkingLotStatus.nr}"`)
        // Gebe Anweisung Geräte einzuschalten
        this.enableParkingGuideSystem([ parkingLotGuideDevice.mac, ...parkingLotGuideDevice.parents ]);
      }
      
      // Schalte Einfahrschranken
      const enterServos = await deviceRepository.findBy({ type: { name: DeviceTypeName.ENTER_BARRIER }});
      enterServos.forEach(it => this.utilService.openServoForInterval(it.mac));
    }

    await this.licensePlateRepository.runTransaction(transaction);
  }

  /**
  * Startet den Workflow führ die Ausfahrt eines erkannten Kennzeichens.
  * @param plate Das erkannte Kennzeichen inkl. Meta-Informationen der Kennzeichenerkennung.
  */
  public async startExitWorkflow(plate: DetectedLicensePlate){
    const transaction = async (manager: EntityManager): Promise<void> => {
      const licensePlateRepository = this.licensePlateRepository.forTransaction(manager);
      const licensePlatePhotoTypeRepository = this.licensePlatePhotoTypeRepository.forTransaction(manager);
      const deviceRepository = this.deviceRepository.forTransaction(manager);
      const paymentRepository = this.paymentRepository.forTransaction(manager);

      // Bild auslesen & löschen
      this.loggerService.log('Exit-Workflow started.');
      let image = await this.utilService.readFile(plate.licensePlatePhotoPath);
      this.utilService.deleteFile(plate.licensePlatePhotoPath).catch();

      const licensePlate = await licensePlateRepository.findOneByPlate(plate.licensePlate);
      if(licensePlate == null)
        throw new Error(`License-plate does not exists, plate: "${plate.licensePlate}"`);

      // Finde letztes Einfahrtbild für Kennzeichen
      const enterLicensePlatePhoto = await this.licensePlatePhotoRepository.findLatestByPlate(licensePlate.plate);
      if(enterLicensePlatePhoto == null || (await enterLicensePlatePhoto.type).name === LicensePlatePhotoTypeName.EXIT){
        // Fehler wenn Kennzeichen nie eingefahren ist.
        this.loggerService.error(`No matching enter image, plate: "${licensePlate.plate}"`);
        throw new Error(`No matching enter image, plate: "${licensePlate.plate}"`);
      }

      // Speicher Bild in DB --> Dadurch wird Kennzeichen als ausgecheckt makiert.
      let exitLicensePlatePhoto = new LicensePlatePhoto();
      exitLicensePlatePhoto.date = new Date();
      exitLicensePlatePhoto.image = image;
      exitLicensePlatePhoto.licensePlate = Promise.resolve(licensePlate);
      exitLicensePlatePhoto.type = Promise.resolve((await licensePlatePhotoTypeRepository.findOneByName(LicensePlatePhotoTypeName.EXIT))!);
      exitLicensePlatePhoto = await this.licensePlatePhotoRepository.save(exitLicensePlatePhoto);

      // Erstelle payment.
      const payment = new Payment();
      payment.from = enterLicensePlatePhoto.date;
      payment.to = exitLicensePlatePhoto.date;
      payment.licensePlate = Promise.resolve(licensePlate);
      payment.account = Promise.resolve(await licensePlate.account);
      payment.price = await this.utilService.calculatePrice(payment.from,payment.to);
      await paymentRepository.save(payment);
      this.loggerService.log(`Created payment, plate: "${licensePlate.plate}", email: "${(await licensePlate.account).email}", price: "${payment.price}", to: "${payment.to}", from: "${payment.from}"`);

      // Update Displays
      this.synchronizeSpaceDisplays();

      // Schalte Ausfahrschranken
      const enterServos = await deviceRepository.findBy({ type: { name: DeviceTypeName.EXIT_BARRIER }});
      enterServos.forEach(it => this.utilService.openServoForInterval(it.mac));
    };
    this.licensePlateRepository.runTransaction(transaction);
  }

  /**
  * Updated alle Anzeigen, welche die Anzahl an verfügbaren Parkplätzen anzeigen.
  */
  private async synchronizeSpaceDisplays(){
    // Update Displays
    const spaceDisplays = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.SPACE_DISPLAY }});
    const availableParkingLots = await this.utilService.countAvailableParkingLots();
    spaceDisplays.forEach(it => this.communicationService.sendInstruction(it.mac,availableParkingLots));
  }

  /**
  * Aktiviert das Parkleitsystem für die angegebenen Geräte. Es wird davon ausgegangen das die übergebenen Geräte zum Parkleitsystem gehören.
  * Sollte das System bereits in Verwendung sein, wird es deaktiviert und erneut aktiviert.
  * @param devices Die zu schaltenden Geräte.
  */
  private async enableParkingGuideSystem(devices: string[]): Promise<void> {
    this.latestEnterWorkflowStart = new Date();
    // Deaktivierte alle bisherigen Parking-Guide-Lampen, muss erzwungen werden.
    await this.disableParkingGuideSystem(true);

    await Promise.all(devices.map(async it => await this.communicationService.sendInstruction(it,true)));

    // Request um Sensoren in Zukunft zu deaktivieren
    setTimeout(async () => this.disableParkingGuideSystem(), PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS * 1000);
  }

  /**
  * Deaktiviert das Parkleitsystem.
  * @param isForced Gibt an, ob eine deaktivierung erzwungen werden soll.
  * Wurde sie nicht erzwungen, dann kann der Aufruf nicht erfolgreich sein, sollte das Parkleitsystem noch nicht für ein vorgegebenes Interval aktiv sein.
  */
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
}

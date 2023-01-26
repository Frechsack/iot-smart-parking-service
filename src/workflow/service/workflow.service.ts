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
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { DeviceTypeName } from 'src/orm/entity/device-type';
import { UtilService } from 'src/core/service/util.service';
import { Payment } from 'src/orm/entity/payment';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
import { filter } from 'rxjs';
import { StatusMessage } from 'src/core/messages/status-message';
import { ZoneRepository } from 'src/orm/repository/zone.repository';
import { ParkingLotPrioritisingRepository } from 'src/orm/repository/parking-lot-prioritising.repository';
import { ParkingLotStatus } from 'src/orm/entity/parking-lot-status';
import { ZoneRoutingRepository } from 'src/orm/repository/zone-routing.repository';
import { Zone } from 'src/orm/entity/zone';
import { DeviceInstruction } from 'src/orm/entity/device-instruction';

const CWO_SENSOR_THRESHOLD = 2;
const CLIMATE_WORKFLOW_RUNTIME_SECONDS = 20;

@Injectable()
export class WorkflowService {

  private latestClimateWorkflowStart?: Date;

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly plateDetectionService: PlateDetectionService,
    private readonly licensePlatePhotoRepository: LicensePlatePhotoRepository,
    private readonly licensePlatePhotoTypeRepository: LicensePlatePhotoTypeRepository,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly parkingLotStatusRepository: ParkingLotStatusRepository,
    private readonly loggerService: LoggerService,
    private readonly deviceRepository: DeviceRepository,
    private readonly utilService: UtilService,
    private readonly paymentRepository: PaymentRepository,
    private readonly zoneRepository: ZoneRepository,
    private readonly parkingLotPrioritisingRepository: ParkingLotPrioritisingRepository,
    private readonly zoneRoutingRepository: ZoneRoutingRepository
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
      // Prüfe ob Status von einem co2 Sensor kam.
      const device = await this.deviceRepository.findOneByMac(it.mac);
      if(device == null) return;
      if((await device.type).name !== DeviceTypeName.CWO_SENSOR) return;
      try {
          this.startClimateWorkflow(parseInt(it.status));
      }
      catch{
          this.loggerService.error(`Invalid sensor value for cwo sensor, status: "${it.status}"`);
      }
    });

    // Initial display initialisieren
    setTimeout(() => {
      this.synchronizeSpaceDisplays();
      this.synchronizeSpaceLights();
    }, 2000);
  }

  /**
  * Startet den Worflow für die Umweltkontrolle.
  * @param co2Level Das übermittelte co2 level (1-4)
  */
  public async startClimateWorkflow(co2Level: number){

    if(co2Level <= CWO_SENSOR_THRESHOLD) return;

    // Öffne alle Schranken und starte Sirene
    const barriers =
      [
        ... await this.deviceRepository.findBy({ type: { name: DeviceTypeName.EXIT_BARRIER}}),
        ... await this.deviceRepository.findBy({ type: { name: DeviceTypeName.ENTER_BARRIER }})
      ];
    const alarms = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.ALARM }});
    barriers.forEach(it => this.communicationService.sendInstruction(it.mac,true));
    alarms.forEach(it => this.communicationService.sendInstruction(it.mac,true));

    // Nach Zeit X sollen Schranken und Sirene abgeschaltet werden
    const start =  new Date(Date.now())
    this.latestClimateWorkflowStart = start;

    // Funktion zum schließen aller Schranken und der Sirene.
    // Funktion wird nur ausführen, wenn der Workflow anschließend nicht nochmal gestartet wurde.
    const funStopClimateWorkflow = () => {
      if(this.latestClimateWorkflowStart !== start) return;
      barriers.forEach(it => this.communicationService.sendInstruction(it.mac,false));
      alarms.forEach(it => this.communicationService.sendInstruction(it.mac,false));
    }

    setTimeout(() => funStopClimateWorkflow(),CLIMATE_WORKFLOW_RUNTIME_SECONDS * 1000);
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
      // Update Lights
      this.synchronizeSpaceLights();

      // Schalte Einfahrtschranken
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
      // Update Lights
      this.synchronizeSpaceLights();

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
  * Updated alle Lichter, welche anzeigen ob Parkplätze verfügbar sind oder nicht.
  */
  private async synchronizeSpaceLights(){
    const spaceEnterLights = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.SPACE_ENTER_LIGHT }});
    const spaceExitLights = await this.deviceRepository.findBy({ type: { name: DeviceTypeName.SPACE_EXIT_LIGHT }});
    const availableParkingLots = await this.utilService.countAvailableParkingLots();
    spaceEnterLights.forEach(it => this.communicationService.sendInstruction(it.mac,availableParkingLots > 0));
    spaceExitLights.forEach(it => this.communicationService.sendInstruction(it.mac,availableParkingLots === 0));
  }


  /**
   * Berechnet den optimalen Parkplatz und schaltet passend dazu das Parkleitsystem.
   * @param zonesNr Die Nummern der Zonen die zu schalten sind.
   */
  private async updateParkingGuideForZone(zonesNr: number): Promise<void>{
    const zone = await this.zoneRepository.findByNr(zonesNr);
    if(zone == null)
      return;
      //Evtl. Ausgabe auf Console oder Logger das Zone nicht passt
    const parkingLotPrioritisings = await this.parkingLotPrioritisingRepository.findByZone(zone);
        //1. Prüfe welchge Parkplätze im Array parkingLotPrioritisings noch verfügbar sind (leeren Array erstellen, for scheife über alle Parkinglotprioritisings und gebe nur die zurück, welche frei sind)
    const freeParkingLots = [];
    for(let i = 0; i < parkingLotPrioritisings.length; i++) {
      if (await this.parkingLotStatusRepository.isAvailable((await parkingLotPrioritisings[i].parkingLot).nr) == true) { 
        freeParkingLots.push(parkingLotPrioritisings[i])
      }
    }
  

    if(freeParkingLots.length == 0)
      return;

    let highestPrio = freeParkingLots[0];
    for (let i = 1; i < freeParkingLots.length; i++){
      if(highestPrio.prio < freeParkingLots[i].prio)
        highestPrio = freeParkingLots[i]
    }
    
    const targetZone = await highestPrio.zone;

    if(targetZone == null)
      return;

    const routing = await this.zoneRoutingRepository.findByFromAndTo(zone, targetZone);
    if(routing == null)
      return;

    const zonesToActivate = [await routing.next, await routing.from];
    for(let i = 0; i < zonesToActivate.length; i++){
      const parkingGuideLamps = await this.deviceRepository.findParkingGuideLampsByZone(zonesToActivate[i]);
      for(let y = 0; y < parkingGuideLamps.length; y++){
        this.communicationService.sendInstruction(parkingGuideLamps[y].mac, true)
      }          
    }
  } 

  /**
   * Aktualisiert das Parkleitsystem für die übergegebenen Zonen.
   * @param zonesNr Die Nummern der Zonen die zu schalten sind.
   */
  public async updateParkingguide (zonesNr: number[]): Promise<void> {
    const allParkingGuideLamps = await this.deviceRepository.findAllParkingGuideLamps();
    for(let i = 0; i < allParkingGuideLamps.length; i++)
      this.communicationService.sendInstruction(allParkingGuideLamps[i].mac, false)

    for(let j = 0; j < zonesNr.length; j++)
      this.updateParkingGuideForZone(zonesNr[j])
  }
}

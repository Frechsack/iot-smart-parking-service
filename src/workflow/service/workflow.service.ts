import { HttpServer, Injectable } from '@nestjs/common';
import { CommunicationService } from 'src/core/service/communication.service';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { DetectedLicensePlate } from 'src/plate-detection/detected-license-plate';
import { PlateDetectionService } from 'src/plate-detection/service/plate-detection.service';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlatePhotoRepository } from 'src/orm/repository/license-plate-photo.repository';
import { LicensePlatePhotoTypeRepository } from 'src/orm/repository/license-plate-photo-type.repository';
import { LicensePlatePhoto } from 'src/orm/entity/license-plate-photo';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { EntityManager, PrimaryColumnCannotBeNullableError } from 'typeorm';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { ParkingLotStatusRepository } from 'src/orm/repository/parking-lot-status.repository';
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { DeviceTypeName } from 'src/orm/entity/device-type';
import { UtilService } from 'src/core/service/util.service';
import { Payment } from 'src/orm/entity/payment';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
import { filter, firstValueFrom, map, ReadableStreamLike, tap } from 'rxjs';
import { StatusMessage } from 'src/core/messages/status-message';
import { ZoneRepository } from 'src/orm/repository/zone.repository';
import { ParkingLotPrioritisingRepository } from 'src/orm/repository/parking-lot-prioritising.repository';
import { ParkingLotStatus } from 'src/orm/entity/parking-lot-status';
import { ZoneRoutingRepository } from 'src/orm/repository/zone-routing.repository';
import { Zone } from 'src/orm/entity/zone';
import { DeviceInstruction } from 'src/orm/entity/device-instruction';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CaptureRepository } from 'src/orm/repository/capture.repository';
import { CaptureDto, InitDto, ZoneDto } from '../dto/init-dto';
import { response } from 'express';

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
    private readonly zoneRoutingRepository: ZoneRoutingRepository,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly captureRepository: CaptureRepository
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

    // Initial Overwatch starten
    setTimeout(() => {
      this.initOverwatch();
    }, 5000);
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
   * @param zoneNr Die Nummern der Zonen die zu schalten sind.
   */
  private async updateParkingGuideForZone(zoneNr: number): Promise<void> {
    const asyncFilterFun = async <E> (array: E[], predicate: (item: E) => Promise<boolean>): Promise<E[]> => {
      const isFilter = await Promise.all(array.map(it => predicate(it)));
      return array.filter((_, index) => isFilter[index]);
    }

    const fromZone = await this.zoneRepository.findByNr(zoneNr);
    if(fromZone == null) {
      this.loggerService.warn(`Unknown zone: '${zoneNr}'.`);
      return;
    }

    const parkingLotPrioritisings = 
      await this.parkingLotPrioritisingRepository.findAllByZone(fromZone);
    const availableParkingLotPrioritisings = 
      await asyncFilterFun(parkingLotPrioritisings, async it => this.parkingLotStatusRepository.isAvailable((await it.parkingLot).nr));
    

    if(availableParkingLotPrioritisings.length == 0)
      return;

    const topPrioritisedParkingLot = await availableParkingLotPrioritisings.sort((lhs, rhs) => lhs > rhs ? -1 : rhs > lhs ? 1 : 0)[0].parkingLot;
    const toZone = await topPrioritisedParkingLot.zone;

    if(toZone == null){
      this.loggerService.warn(`Top-prioritized parking-lot is not in a zone: parking-lot: '${topPrioritisedParkingLot.nr}', from-zone: '${fromZone.nr}'.`);
      return;
    }

    if(fromZone.nr === toZone.nr)
      return;

    const routing = await this.zoneRoutingRepository.findOneByFromAndTo(fromZone, toZone);
    if(routing == null){
      this.loggerService.warn(`No routing information for zones: from: '${fromZone.nr}', to: '${toZone.nr}'.`);  
      return;
    }

    [
    ...(await this.deviceRepository.findAllParkingGuideLampsByZone(await routing.next)),
    ...(await this.deviceRepository.findAllParkingGuideLampsByZone(await routing.from))
    ]
      .forEach(it => this.communicationService.sendInstruction(it.mac, true));
  } 

  /**
   * Aktualisiert das Parkleitsystem für die übergegebenen Zonen.
   * @param zonesNr Die Nummern der Zonen die zu schalten sind.
   */
  public async updateOverwatch (zonesNr: number[]): Promise<void> {
    const parkingGuideLamps = await this.deviceRepository.findAllParkingGuideLamps();

    parkingGuideLamps.forEach(it => this.communicationService.sendInstruction(it.mac, false));
    zonesNr.forEach(it => this.updateParkingGuideForZone(it));
  }

  /**
   * Startet das Overwatch Programm. 
   */
  public async initOverwatch(): Promise<void> {
    const captures = await this.captureRepository.find();
    const captureMap = new Map<string, CaptureDto>();
    const zoneMap = new Map<number, ZoneDto>();
    captures.forEach(it => captureMap.set(it.deviceName, { height: it.height, width: it.width, x: it.x, y: it.y}));
    await Promise.all(captures.map(async capture => {
      (await capture.zones).forEach(zone => zoneMap.set(zone.nr, { offsetX: zone.offSetX, offsetY: zone.offSetY, deviceName: capture.deviceName, height: zone.height, width: zone.width }))
    }));

    const endpoint = this.configService.get<string>('OVERWATCH_INIT_ENDPOINT')!;
    const key = this.configService.get<string>('OVERWATCH_KEY');

    this.httpService.post(endpoint, new InitDto(captureMap, zoneMap).toJson(), { headers: { 'key' : key, 'content-type': 'application/json' }})
    .subscribe({
      error: error => this.loggerService.error(`Error during init of overwatch: ${error}`),
      next: response => {
        if(response.status > 204)
          this.loggerService.error(`Error during init of overwatch. Status-code: '${response.status}'.`);
        else
          this.loggerService.log('Overwatch initialized.');
      }
    })
  }

  /**
   * Speichert die Bildausgabe der Overwatch in dem übergebenem stream.
   * @param request Der Stream, in welchen das Bild der Overwatch gespeichert werden soll.
   */
  public async saveComputedImageInStream(request: WritableStream): Promise<void>{
    const endpoint = this.configService.get<string>('OVERWATCH_IMAGE_ENDPOINT')!;
    const key = this.configService.get<string>('OVERWATCH_KEY');
    const response = await this.httpService.axiosRef({
        url: endpoint,
        method: 'GET',
        responseType: 'stream',
        headers: { 'key' : key }
    });
    response.data.pipe(request);
  }


}

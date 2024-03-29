import { HttpException, Injectable } from '@nestjs/common';
import { CommunicationService } from 'src/core/service/communication.service';
import { LoggerService } from 'src/core/service/logger.service';
import { Device } from 'src/orm/entity/device';
import { DeviceInstruction } from 'src/orm/entity/device-instruction';
import { DeviceStatus } from 'src/orm/entity/device-status';
import { DeviceType, DeviceTypeName } from 'src/orm/entity/device-type';
import { ParkingLot } from 'src/orm/entity/parking-lot';
import { DeviceInstructionRepository } from 'src/orm/repository/device-instruction.repository';
import { DeviceStatusRepository } from 'src/orm/repository/device-status.repository';
import { DeviceTypeRepository } from 'src/orm/repository/device-type.repository';
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { EntityManager } from 'typeorm';
import { DeviceDto } from '../dto/device-dto';
import { DeviceStatusDto } from '../dto/device-status-dto';
import { DeviceInstructionDto } from '../dto/device-instruction-dto';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { Zone } from 'src/orm/entity/zone';
import { ZoneRepository } from 'src/orm/repository/zone.repository';

/**
* Stellt Standartfunktionen für die Anlage und modifizierung von Geräten, deren Anweisungen und Status bereit.
*/
@Injectable()
export class DeviceService {

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceStatusRepository: DeviceStatusRepository,
    private readonly deviceInstructionRepository: DeviceInstructionRepository,
    private readonly deviceTypeRepository: DeviceTypeRepository,
    private readonly parkingLotRepository: ParkingLotRepository,
    private readonly communicationService: CommunicationService,
    private readonly loggerService: LoggerService,
    private readonly zoneRepository: ZoneRepository
  ) {
    this.loggerService.context = DeviceService.name;
    // Externe Informationen speichern
    this.communicationService.registerLane
      .subscribe(it => this.registerDevice(it.mac,it.deviceType,it.parkingLotNr, it.zoneNr).catch(() => {}));
    this.communicationService.statusLane
      .subscribe(it => this.saveDeviceStatus(it.mac, it.status).catch(() => {}));
    this.communicationService.instructionLane
      .subscribe(it => this.saveDeviceInstruction(it.mac, it.instruction).catch(() => {}));

    // Füge standart-entitäten ein.
    this.deviceTypeRepository.insertDefaults();
  }

  /**
  * Gibt ein einzelnes Gerät aus. Existert das Gerät nicht, wird eine {@link HttpException} geworfen.
  * @param mac Die Mac des zu suchenden Geräts.
  * @returns Gibt das gefundene Gerät zurück. Existert das Gerät nicht, wird eine Exception auf dem error-channel geworfen.
  */
  public async getDevice(mac: string): Promise<DeviceDto> {
    const device = await this.deviceRepository.findOne({
      where: { mac: mac },
      select: { mac: true, parkingLot: { nr: true}, type: { name: true } }
    });

    if(device == null)
      throw new HttpException('Device not found',404);
    return new DeviceDto(device.mac,(await device.type).name, (await device.parkingLot)?.nr);
  }

  /**
  * Gibt alle Geräte zurück.
  * @param page Die abzurufende Seite der imaginären Pagination.
  * @param pageSize Die Anzahl an Elementen pro Seite.
  * @returns Die Menge an Geräten.
  */
  public async getDevices(page: number = 0, pageSize: number = 20): Promise<PaginationDto<DeviceDto>>{
    const devices = await this.deviceRepository.findAndCount({
      skip: page * pageSize,
      take: pageSize,
      order: { mac: 'ASC'},
      select: { mac: true, parkingLot: { nr: true}, type: { name: true } }
    });

    const devicePromises = devices[0].map(it => {
      return new Promise<DeviceDto>(async resolve => {
        resolve(new DeviceDto(it.mac, (await it.type).name, (await it.parkingLot)?.nr ));
      });
    });
    return new PaginationDto(devices[1], await Promise.all(devicePromises));
  }

  /**
   * Gibt die Status von einem Gerät aus.
   * @param mac Die Mac des Geräts, dessen Status gelesen werden soll.
   * @param page Die abzurufende Seite.
   * @param pageSize Die Anzahl an Elementen pro Seite.
   * @returns Gibt die gefundenen Status zurück.
   */

  public async getStatus(mac: string, page: number = 0, pageSize: number = 20): Promise<PaginationDto<DeviceStatusDto>>{
    const status = await this.deviceStatusRepository.findAndCount({
      skip: page * pageSize,
      take: pageSize,
      where: { device: { mac: mac }},
      order: { date: 'DESC'}
    });

    const statusPromises = status[0].map(it => {
      return new Promise<DeviceStatusDto>(async resolve => {
        resolve(new DeviceStatusDto((await it.device).mac,it.status,it.date));
      });
    });
    return new PaginationDto(status[1],await Promise.all(statusPromises));
  }

   /**
   * Gibt die Anweisungen von einem Gerät aus.
   * @param mac Die Mac des Geräts, dessen Anweisungen gelesen werden soll.
   * @param page Die abzurufende Seite.
   * @param pageSize Die Anzahl an Elementen pro Seite.
   * @returns Gibt die gefundenen Anweisungen zurück.
   */
   public async getInstructions(mac: string, page: number = 0, pageSize: number = 20): Promise<PaginationDto<DeviceInstructionDto>>{
    const instructions = await this.deviceInstructionRepository.findAndCount({
      skip: page * pageSize,
      take: pageSize,
      where: { device: { mac: mac }},
      order: { date: 'DESC'}
    });

    const instructionPromises = instructions[0].map(is => {
      return new Promise<DeviceInstructionDto>(async resolve => {
        resolve(new DeviceInstructionDto((await is.device).mac, is.instruction, is.date));
      });
    });
    return new PaginationDto(instructions[1], await Promise.all(instructionPromises));
   }

  /**
  * Sichert eine Geräteanweisung in der Datenbank.
  * @param mac Die mac des Geräts, deren Anweisung gespeichert werden soll.
  * @param instruction Die zu speichernde Anweisung.
  * @returns Gibt das gespeicherte Datenbankobjekt zurück.
  */
  private async saveDeviceInstruction(mac: string, instruction: string): Promise<DeviceInstruction>{
    try {
      // Prüfe ob Gerät vorhanden
      if(!(await this.deviceRepository.existsByMac(mac)))
        this.thrownUnknowDeviceException(mac);
      // Füge Anweisung hinzu
      let deviceInstruction = new DeviceInstruction();
      deviceInstruction.date = new Date(Date.now());
      deviceInstruction.instruction = instruction;
      deviceInstruction.device = Promise.resolve((await this.deviceRepository.findOneByMac(mac))!);
      deviceInstruction = await this.deviceInstructionRepository.save(deviceInstruction);
      this.loggerService.log(`Update of device-instruction completed, mac: "${mac}", instruction: "${instruction}"`);
      return deviceInstruction;
    }
    catch(e) {
      this.loggerService.error(`Update of device-instruction failed, mac: "${mac}", instruction: "${instruction}", error: "${e}"`);
      throw e;
    }
  }

  /**
  * Sichert einen Gerätestatus in der Datenbank.
  * @param mac Die mac des Geräts, deren Status gespeichert werden soll.
  * @param status Der zu sichernde Status.
  * @returns Gibt das gespeicherte Datenbankobjekt zurück.
  */
  private async saveDeviceStatus(mac: string, status: string): Promise<DeviceStatus> {
    try {
      // Prüfe ob Gerät vorhanden
      if(!(await this.deviceRepository.existsByMac(mac)))
        this.thrownUnknowDeviceException(mac);
      // Füge Status hinzu
      let deviceStatus = new DeviceStatus();
      deviceStatus.date = new Date(Date.now());
      deviceStatus.status = status;
      deviceStatus.device = Promise.resolve((await this.deviceRepository.findOneByMac(mac))!);
      deviceStatus = await this.deviceStatusRepository.save(deviceStatus);
      this.loggerService.log(`Update of device-status completed, mac: "${mac}", status: "${status}"`);
      return deviceStatus;
    }
    catch(e){
      // Möglicherweise sind Aufrufe zu schnell, wodurch nicht eindeutige Primärschlüssel entstehen.
      // Versuche den letzten Eintrag in der DB zu aktualisieren.
      let deviceStatus = await this.deviceStatusRepository.findLatestById(mac);

      if(deviceStatus == null){
        this.loggerService.error(`Update of device-status failed, error: "${e}"`);
        throw e;
      }

      try {
          deviceStatus.status = status;
          deviceStatus = await this.deviceStatusRepository.save(deviceStatus);
          return deviceStatus;
      }
      catch(e){
        this.loggerService.error(`Update of device-status failed, error: "${e}"`);
        throw e;
      }
    }
  }

  /**
  * Wirft eine Exception, sollte ein Gerät in der Datenbank nicht gefunden worden sein.
  * @param mac Die mac des nicht gefundenen Geräts.
  */
  private thrownUnknowDeviceException(mac: string){
    throw new Error(`Unknown device, mac: "${mac}"`);
  }


  /**
  * Registriert ein neues Gerät in der Datenbank. Die Funktion wird in einer Transaktion durchgeführt.
  * @param mac Die mac des zu erstellenden Geräts.
  * @param deviceTypeName Der Gerätetyp.
  * @param parkingLotNr Die optionale Parkplatzzuordnung.
  * @param parentDeviceMac Die optionale mac des übergeordneten Geräts.
  */
  private async registerDevice(mac: string, deviceTypeName: DeviceTypeName, parkingLotNr: number | null | undefined = undefined, zoneNr: number | null | undefined = undefined): Promise<Device>{
    const transaction = async (manager: EntityManager): Promise<Device> => {
      const deviceRepository = this.deviceRepository.forTransaction(manager);
      const deviceTypeRepository = this.deviceTypeRepository.forTransaction(manager);
      const parkingLotRepository = this.parkingLotRepository.forTransaction(manager);

      // Finde Parkplatz.
      let parkingLot: ParkingLot | null = parkingLotNr == null ?
        null :
        await parkingLotRepository.findOneByNr(parkingLotNr);

      // Prüfe ob Parkplatz angelegt werden muss.
      if(parkingLot === null && parkingLotNr != null){
        parkingLot = new ParkingLot();
        parkingLot.nr = parkingLotNr;
        parkingLot = await parkingLotRepository.save(parkingLot);
      }

      // Finde Zone
      const zone: Zone | null = zoneNr == null
        ? null
        : await this.zoneRepository.findByNr(zoneNr);
      if(zone == null && zoneNr != null) {
        this.loggerService.warn(`Device '${mac}' refers to unknown zone '${zoneNr}'.`);
      }


      // Finde Gerätetyp.
      const deviceType: DeviceType | null = await deviceTypeRepository.findOneByName(deviceTypeName);

      // Erstelle Gerät
      let device = await deviceRepository.findOneByMac(mac);
      if(device === null) {
        // Lege neues Gerät an
        device = new Device();
        device.mac = mac;
      }
      device.type = Promise.resolve(deviceType);
      device.parkingLot = Promise.resolve(parkingLot === null ? null : parkingLot);
      device.zone = Promise.resolve(zone);
      return await deviceRepository.save(device)
    }
    try {
      const device = await this.deviceRepository.runTransaction(transaction);
      this.loggerService.log(`Register of device completed, mac: "${device.mac}"`);
      return device;
    }
    catch (e) {
      this.loggerService.error(`Register of device failed, error: "${e}"`);
      throw e;
    }
  }

}

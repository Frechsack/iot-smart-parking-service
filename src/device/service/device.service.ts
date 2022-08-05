import { Injectable } from '@nestjs/common';
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
    private readonly loggerService: LoggerService
  ) {
    this.loggerService.context = DeviceService.name;
    // Externe Informationen speichern
    this.communicationService.registerLane
      .subscribe(it => this.registerDevice(it.mac,it.deviceType,it.parkingLotNr,it.parentDeviceMac));
    this.communicationService.statusLane
      .subscribe(it => this.saveDeviceStatus(it.mac, it.status));
    this.communicationService.instructionLane
      .subscribe(it => this.saveDeviceInstruction(it.mac, it.instruction));

    // Füge standart-entitäten ein.
    this.deviceTypeRepository.insertDefaults();
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
      deviceInstruction.date = new Date();
      deviceInstruction.instruction = instruction;
      deviceInstruction.device = Promise.resolve((await this.deviceRepository.findOneByMac(mac))!);
      deviceInstruction = await this.deviceInstructionRepository.save(deviceInstruction);
      this.loggerService.log(`Update of device-instruction completed, mac: "${mac}", instruction: "${instruction}"`);
      return deviceInstruction;
    }
    catch(e) {
      this.loggerService.error(`Update of device-instruction failed, error: "${e}"`);
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
      deviceStatus.date = new Date();
      deviceStatus.status = status;
      deviceStatus.device = Promise.resolve((await this.deviceRepository.findOneByMac(mac))!);
      deviceStatus = await this.deviceStatusRepository.save(deviceStatus);
      this.loggerService.log(`Update of device-status completed, mac: "${mac}", status: "${status}"`);
      return deviceStatus;
    }
    catch(e){
      this.loggerService.log(`Update of device-status failed, error: "${e}"`);
      throw e;
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
  private async registerDevice(mac: string, deviceTypeName: DeviceTypeName, parkingLotNr: number | null | undefined = undefined, parentDeviceMac: string | null | undefined = undefined): Promise<Device>{
    const transaction = async (manager: EntityManager): Promise<Device> => {
      const deviceRepository = this.deviceRepository.forTransaction(manager);
      const deviceTypeRepository = this.deviceTypeRepository.forTransaction(manager);
      const parkingLotRepository = this.parkingLotRepository.forTransaction(manager);

      // Prüfe ob eigene & eltern element gleiche mac haben
      if(mac === parentDeviceMac)
        throw new Error('Parent-device-mac and device-mac are equal');

      // Finde Elterngerät.
      const parentDevice: Device | null = parentDeviceMac == null ?
        null :
        await deviceRepository.findOneByMac(parentDeviceMac);

      // Prüfe ob Elterngerät existiert
      if(parentDeviceMac != null && parentDevice === null)
        this.thrownUnknowDeviceException(parentDeviceMac);

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
      device.parent = Promise.resolve(parentDevice === null ? null : parentDevice);
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

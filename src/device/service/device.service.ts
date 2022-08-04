import { Injectable } from '@nestjs/common';
import { CommunicationService } from 'src/core/service/communication.service';
import { Device } from 'src/orm/entity/device';
import { DeviceType, DeviceTypeName } from 'src/orm/entity/device-type';
import { ParkingLot } from 'src/orm/entity/parking-lot';
import { DeviceInstructionRepository } from 'src/orm/repository/device-instruction.repository';
import { DeviceStatusRepository } from 'src/orm/repository/device-status.repository';
import { DeviceTypeRepository } from 'src/orm/repository/device-type.repository';
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';

@Injectable()
export class DeviceService {

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceStatusRepository: DeviceStatusRepository,
    private readonly deviceInstructionRepository: DeviceInstructionRepository,
    private readonly deviceTypeRepository: DeviceTypeRepository,
    private readonly parkingLotRepository: ParkingLotRepository,
    private readonly communicationService: CommunicationService
  ) {
    this.communicationService.registerLane.subscribe(it => this.registerDevice(it.mac,it.deviceType,it.parkingLotNr,it.parentDeviceMac));
  }

  /**
  * Registriert ein neues Gerät in der Datenbank.
  * @param mac Die mac des zu erstellenden Geräts.
  * @param deviceTypeName Der Gerätetyp.
  * @param parkingLotNr Die optionale Parkplatzzuordnung.
  * @param parentDeviceMac Die optionale mac des übergeordneten Geräts.
  */
  private async registerDevice(mac: string, deviceTypeName: DeviceTypeName, parkingLotNr: number | null = undefined, parentDeviceMac: string | null = undefined): Promise<Device>{

    // Prüfe ob eigene & eltern element gleiche mac haben
    if(mac === parentDeviceMac)
      throw new Error('Parent-device-mac and device-mac are equal');

    // Finde Elterngerät.
    const parentDevice: Device | null = parentDeviceMac == null ?
      null :
      await this.deviceRepository.findOneByMac(parentDeviceMac);

    // Prüfe ob Elterngerät existiert
    if(parentDeviceMac != null && parentDevice === null)
      throw new Error(`Parent-device does not exists, mac: "${parentDeviceMac}"`);

    // Finde Parkplatz.
    let parkingLot: ParkingLot | null = parkingLotNr == null ?
      null :
      await this.parkingLotRepository.findOneByNr(parkingLotNr);

    // Prüfe ob Parkplatz angelegt werden muss.
    if(parkingLot === null && parkingLotNr != null){
      parkingLot = new ParkingLot();
      parkingLot.nr = parkingLotNr;
      parkingLot = await this.parkingLotRepository.save(parkingLot);
    }

    // Finde Gerätetyp.
    const deviceType: DeviceType = await this.deviceTypeRepository.findOneByName(deviceTypeName);

    // Erstelle Gerät
    let device: Device | null = await this.deviceRepository.findOneByMac(mac);
    if(device === null) {
      // Lege neues Gerät an
      device = new Device();
      device.mac = mac;
    }
    device.type = Promise.resolve(deviceType);
    device.parkingLot = Promise.resolve(parkingLot === null ? null : parkingLot);
    device.parent = Promise.resolve(parentDevice === null ? null : parentDevice);
    return await this.deviceRepository.save(device)

  }

}

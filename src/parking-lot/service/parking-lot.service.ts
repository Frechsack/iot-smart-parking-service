import { Injectable } from '@nestjs/common';
import { DeviceRepository } from 'src/orm/repository/device.repository';

@Injectable()
export class ParkingLotService {

  constructor(
    private readonly deviceRepository: DeviceRepository
  ){
  }

  public async getDevicesMac(nr: number, page: number, pageSize: number): Promise<string[]> {
    const devices = await this.deviceRepository.find({
      where: { parkingLot: { nr: nr }},
      skip: page * pageSize,
      take: pageSize,
      order: { mac: 'ASC' }
    });
    return devices.map(it => it.mac);
  }
}

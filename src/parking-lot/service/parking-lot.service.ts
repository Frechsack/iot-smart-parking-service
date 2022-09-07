import { Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { DeviceRepository } from 'src/orm/repository/device.repository';
import { ParkingLotStatusRepository } from 'src/orm/repository/parking-lot-status.repository';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { ParkingLotDto } from '../dto/parking-lot-dto';

@Injectable()
export class ParkingLotService {

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly parkingLotStatusRepository: ParkingLotStatusRepository,
  ){
  }

  public async getParkingLots(): Promise<PaginationDto<ParkingLotDto>> {
    const parkingLots = await this.parkingLotStatusRepository.findAndCount({ order: { nr: 'DESC' }});
    return new PaginationDto(parkingLots[1], parkingLots[0].map(it => new ParkingLotDto(it.nr,it.status == null
      ? true
      : it.status.toLowerCase() === 'false'
      )
    ));
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

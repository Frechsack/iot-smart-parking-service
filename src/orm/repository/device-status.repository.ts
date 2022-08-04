import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceStatus } from '../entity/device-status';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceStatusRepository extends AbstractRepository<DeviceStatus> {

  constructor(
    @InjectRepository(DeviceStatus)
    public readonly repository: Repository<DeviceStatus>
  ){
    super(repository);
  }

  public async findLatestById(mac: string): Promise<DeviceStatus | null> {
    return this.findOne({ where: { deviceMac: mac }, order: { date: 'DESC' }});
  }
}

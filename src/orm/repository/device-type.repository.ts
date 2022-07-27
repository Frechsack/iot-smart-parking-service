import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceType } from '../entity/device-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceTypeRepository extends AbstractRepository<DeviceType> {

  constructor(
    @InjectRepository(DeviceType)
    public readonly repository: Repository<DeviceType>
  ){
    super(repository);
  }
}

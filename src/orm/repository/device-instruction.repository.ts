import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceInstruction } from '../entity/device-instruction';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceInstructionRepository extends AbstractRepository<DeviceInstruction> {

  constructor(
    @InjectRepository(DeviceInstruction)
    public readonly repository: Repository<DeviceInstruction>
  ){
    super(repository);
  }

  public async findLatestInstruction(mac: string): Promise<DeviceInstruction | null> {
    return this.findOne({ where: { deviceMac: mac }, order: { date: 'DESC' }});
  }
}

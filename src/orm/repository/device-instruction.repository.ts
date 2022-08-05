import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  public async findLatestById(mac: string): Promise<DeviceInstruction | null> {
    return this.findOne({ where: { device: { mac: mac } }, order: { date: 'DESC' }});
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceInstructionRepository {
    return new DeviceInstructionRepository(manager.getRepository(DeviceInstruction));
  }
}

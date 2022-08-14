import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DeviceChildren } from '../entity/device-children';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceChildrenRepository extends AbstractRepository<DeviceChildren> {

  constructor(
    @InjectRepository(DeviceChildren)
    public readonly repository: Repository<DeviceChildren>
  ){
    super(repository);
  }

  public async findOneByMac(mac: string): Promise<DeviceChildren | null> {
    return this.findOne({ where: { mac: mac }});
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceChildrenRepository {
    return new DeviceChildrenRepository(manager.getRepository(DeviceChildren));
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DeviceParents } from '../entity/device-parents';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceParentsRepository extends AbstractRepository<DeviceParents> {

  constructor(
    @InjectRepository(DeviceParents)
    public readonly repository: Repository<DeviceParents>
  ){
    super(repository);
  }

  public async findOneByMac(mac: string): Promise<DeviceParents | null> {
    return this.findOne({ where: { mac: mac }});
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceParentsRepository {
    return new DeviceParentsRepository(manager.getRepository(DeviceParents));
  }
}

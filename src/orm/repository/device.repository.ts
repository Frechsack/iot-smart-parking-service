import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Device } from '../entity/device';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceRepository extends AbstractRepository<Device> {

  constructor(
    @InjectRepository(Device)
    public readonly repository: Repository<Device>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceRepository {
    return new DeviceRepository(manager.getRepository(Device));
  }

  public async findOneByMac(mac: string): Promise<Device | null> {
    return this.findOneBy({ mac: mac });
  }

  public async existsByMac(mac: string): Promise<boolean> {
    const element = await this.findOneBy({ mac: mac });
    return element !== null;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    return this.findOne({ where: { device: { mac: mac } }, order: { date: 'DESC' }});
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceStatusRepository {
    return new DeviceStatusRepository(manager.getRepository(DeviceStatus));
  }
}

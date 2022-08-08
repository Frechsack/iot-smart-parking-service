import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LicensePlateStatus } from '../entity/license-plate-status';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlateStatusRepository extends AbstractRepository<LicensePlateStatus> {

  constructor(
    @InjectRepository(LicensePlateStatus)
    public readonly repository: Repository<LicensePlateStatus>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): LicensePlateStatusRepository {
    return new LicensePlateStatusRepository(manager.getRepository(LicensePlateStatus));
  }

  public findOneByPlate(plate: string): Promise<LicensePlateStatus | null>{
    return this.findOneBy({ licensePlate: plate });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, In } from 'typeorm';
import { LicensePlate } from '../entity/license-plate';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlateRepository extends AbstractRepository<LicensePlate> {

  constructor(
    @InjectRepository(LicensePlate)
    public readonly repository: Repository<LicensePlate>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): LicensePlateRepository {
    return new LicensePlateRepository(manager.getRepository(LicensePlate));
  }

  public async existsByPlate(plate: string | string[]): Promise<boolean> {
    let plates: string[] = Array.isArray(plate) ? plate : [plate];
    return (await this.findBy({ plate: In (plates) })).length > 0;
  }
}

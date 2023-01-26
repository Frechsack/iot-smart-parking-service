import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Payment } from '../entity/payment';
import { Zone } from '../entity/zone';
import { ZoneRouting } from '../entity/zone-routing';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ZoneRepository extends AbstractRepository<Zone> {

  constructor(
    @InjectRepository(Zone)
    public readonly repository: Repository<Zone>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): ZoneRepository {
    return new ZoneRepository(manager.getRepository(Zone));
  }

  public async findByNr(nr: number): Promise<Zone|null>{
    return this.findOneBy({nr:nr});
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Payment } from '../entity/payment';
import { ZoneRouting } from '../entity/zone-routing';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ZoneRoutingRepository extends AbstractRepository<ZoneRouting> {

  constructor(
    @InjectRepository(ZoneRouting)
    public readonly repository: Repository<ZoneRouting>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): ZoneRoutingRepository {
    return new ZoneRoutingRepository(manager.getRepository(ZoneRouting));
  }
}
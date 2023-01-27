import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ParkingLotPrioritising } from '../entity/parking-lot-prioritising';
import { Payment } from '../entity/payment';
import { Zone } from '../entity/zone';
import { ZoneRouting } from '../entity/zone-routing';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ParkingLotPrioritisingRepository extends AbstractRepository<ParkingLotPrioritising> {

  constructor(
    @InjectRepository(ParkingLotPrioritising)
    public readonly repository: Repository<ParkingLotPrioritising>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): ParkingLotPrioritisingRepository {
    return new ParkingLotPrioritisingRepository(manager.getRepository(ParkingLotPrioritising));
  }

  public findAllByZone(zone: Zone): Promise<ParkingLotPrioritising[]>{
    return this.find({where:{zone:{nr:zone.nr}}})
  }
}
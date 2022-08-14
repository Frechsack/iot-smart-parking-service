import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ParkingLotStatus } from '../entity/parking-lot-status';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ParkingLotStatusRepository extends AbstractRepository<ParkingLotStatus> {

  constructor(
    @InjectRepository(ParkingLotStatus)
    public readonly repository: Repository<ParkingLotStatus>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): ParkingLotStatusRepository {
    return new ParkingLotStatusRepository(manager.getRepository(ParkingLotStatus));
  }

  public findOneByNr(nr: number): Promise<ParkingLotStatus | null>{
    return this.findOneBy({ nr: nr });
  }
}

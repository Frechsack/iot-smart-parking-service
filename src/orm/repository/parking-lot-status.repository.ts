import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository , Not, IsNull } from 'typeorm';
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

  public async findOneByNr(nr: number): Promise<ParkingLotStatus | null>{
    return this.findOneBy({ nr: nr });
  }

  public async findFirstAvailable(): Promise<ParkingLotStatus | null> {
    return this.findOne({ where: [{ status: Not('true')}, { status: IsNull()}], order: { nr: 'ASC' }});
  }

  public async isParkingLotAvailable(): Promise<boolean> {
    return (await this.findFirstAvailable()) !== null;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ParkingLotGuidingDevices } from '../entity/parking-lot-guiding-devices';
import { ParkingLotStatus } from '../entity/parking-lot-status';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ParkingLotGuidingDevicesRepository extends AbstractRepository<ParkingLotGuidingDevices> {

  constructor(
    @InjectRepository(ParkingLotGuidingDevices)
    public readonly repository: Repository<ParkingLotGuidingDevices>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): ParkingLotGuidingDevicesRepository {
    return new ParkingLotGuidingDevicesRepository(manager.getRepository(ParkingLotGuidingDevices));
  }

  public async findOneByNr(nr: number): Promise<ParkingLotGuidingDevices | null>{
    return this.findOneBy({ nr: nr });
  }
}

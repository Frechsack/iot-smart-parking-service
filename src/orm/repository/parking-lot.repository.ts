import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLot } from '../entity/parking-lot';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class ParkingLotRepository extends AbstractRepository<ParkingLot> {

  constructor(
    @InjectRepository(ParkingLot)
    public readonly repository: Repository<ParkingLot>
  ){
    super(repository);
  }

  public async findOneByNr(nr: number): Promise<ParkingLot | null> {
    return this.findOneBy({ nr: nr });
  }
}

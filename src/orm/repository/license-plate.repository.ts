import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

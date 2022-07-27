import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicensePlatePhotoType } from '../entity/license-plate-photo-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlatePhotoTypeRepository extends AbstractRepository<LicensePlatePhotoType> {

  constructor(
    @InjectRepository(LicensePlatePhotoType)
    public readonly repository: Repository<LicensePlatePhotoType>
  ){
    super(repository);
  }
}

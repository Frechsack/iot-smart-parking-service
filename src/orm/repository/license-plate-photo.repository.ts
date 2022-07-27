import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicensePlatePhoto } from '../entity/license-plate-photo';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlatePhotoRepository extends AbstractRepository<LicensePlatePhoto> {

  constructor(
    @InjectRepository(LicensePlatePhoto)
    public readonly repository: Repository<LicensePlatePhoto>
  ){
    super(repository);
  }
}

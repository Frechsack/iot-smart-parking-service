import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LicensePlatePhotoType, LicensePlatePhotoTypeName, valueOf } from '../entity/license-plate-photo-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlatePhotoTypeRepository extends AbstractRepository<LicensePlatePhotoType> {

  constructor(
    @InjectRepository(LicensePlatePhotoType)
    public readonly repository: Repository<LicensePlatePhotoType>
  ){
    super(repository);
    this.requireDefaults();
  }

  public async findOneByName(name: LicensePlatePhotoTypeName): Promise<LicensePlatePhotoType | null> {
    return this.findOneBy({ name: name });
  }

  private async requireDefaults(){
    for(const photoType in LicensePlatePhotoTypeName){
      if(await this.findOneByName(valueOf(photoType)) !== null) continue;
      
      const element = new LicensePlatePhotoType();
      element.name = valueOf(photoType);
      this.save(element);
    }
  }
}

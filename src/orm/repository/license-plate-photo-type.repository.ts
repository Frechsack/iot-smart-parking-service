import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LicensePlatePhotoType, LicensePlatePhotoTypeName, valueOf } from '../entity/license-plate-photo-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class LicensePlatePhotoTypeRepository extends AbstractRepository<LicensePlatePhotoType> {

  constructor(
    @InjectRepository(LicensePlatePhotoType)
    public readonly repository: Repository<LicensePlatePhotoType>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): LicensePlatePhotoTypeRepository {
    return new LicensePlatePhotoTypeRepository(manager.getRepository(LicensePlatePhotoType));
  }

  public async findOneByName(name: LicensePlatePhotoTypeName): Promise<LicensePlatePhotoType | null> {
    return this.findOneBy({ name: name });
  }

  public async insertDefaults(){
    for(const photoType in LicensePlatePhotoTypeName){
      if(await this.findOneByName(valueOf(photoType)) !== null) continue;

      const element = new LicensePlatePhotoType();
      element.name = valueOf(photoType);
      this.save(element);
    }
  }
}

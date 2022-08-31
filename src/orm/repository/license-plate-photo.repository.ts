import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): LicensePlatePhotoRepository {
    return new LicensePlatePhotoRepository(manager.getRepository(LicensePlatePhoto));
  }

  public findLatestByPlate(plate: string): Promise<LicensePlatePhoto | null> {
    return this.findOne({ order: { date: 'DESC' } , where: { licensePlate: { plate: plate }}});
  }
}

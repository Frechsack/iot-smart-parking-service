import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '../entity/account';
import { Capture } from '../entity/capture';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class CaptureRepository extends AbstractRepository<Capture> {

  constructor(
    @InjectRepository(Capture)
    public readonly repository: Repository<Capture>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): CaptureRepository {
    return new CaptureRepository(manager.getRepository(Capture));
  }
}

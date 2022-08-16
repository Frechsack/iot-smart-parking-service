import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BankConnection } from '../entity/bank-connection';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class BankConnectionRepository extends AbstractRepository<BankConnection> {

  constructor(
    @InjectRepository(BankConnection)
    public readonly repository: Repository<BankConnection>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): BankConnectionRepository {
    return new BankConnectionRepository(manager.getRepository(BankConnection));
  }

  public async findOneByIban(iban: string): Promise<BankConnection | null>{
    return this.findOneBy({ iban: iban });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '../entity/account';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class AccountRepository extends AbstractRepository<Account> {

  constructor(
    @InjectRepository(Account)
    public readonly repository: Repository<Account>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): AccountRepository {
    return new AccountRepository(manager.getRepository(Account));
  }
}

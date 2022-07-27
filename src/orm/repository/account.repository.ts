import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

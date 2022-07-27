import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}

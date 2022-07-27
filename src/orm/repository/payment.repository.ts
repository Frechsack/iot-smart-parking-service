import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entity/payment';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class PaymentRepository extends AbstractRepository<Payment> {

  constructor(
    @InjectRepository(Payment)
    public readonly repository: Repository<Payment>
  ){
    super(repository);
  }
}

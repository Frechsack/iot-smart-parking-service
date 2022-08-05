import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): PaymentRepository {
    return new PaymentRepository(manager.getRepository(Payment));
  }
}

import { Entity, Column, OneToMany } from 'typeorm';
import { Account } from './account';

@Entity({ name: 'bank_connection' })
export class BankConnection {

  @Column({type: "varchar", primary: true })
  public iban: String;

  @OneToMany(()=>Account, it => it.bankConnection)
  public accounts: Promise <Account[]>;

}

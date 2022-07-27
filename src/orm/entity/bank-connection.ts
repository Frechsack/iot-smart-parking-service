import { Entity, Column, OneToMany } from 'typeorm';
import { Account } from './account';

@Entity({ name: 'bank_connection'})
export class BankConnection {

  @Column({type: "varchar", primary: true, nullable: false})
  public iban: String;


  @OneToMany(()=>Account, (cringe)=>cringe.bankConnection)
  public accounts: Promise <Account[]>;


}

import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuthenticationToken } from './authentication-token';
import { BankConnection } from './bank-connection';
import { LicensePlate } from './license-plate';
import { Payment } from './payment';

@Entity({ name: 'account'})
export class Account {

  @Column({type: "varchar", primary: true })
  public email: String;

  @Column({type: "varchar", nullable: false})
  public secret: string;

  @ManyToOne(() => BankConnection, (it) => it.accounts, { nullable: true })
  @JoinColumn({name: 'bank_connection_iban'})
  public bankConnection: Promise<BankConnection | null>

  @OneToMany(() => AuthenticationToken, it => it.owner)
  public jwts: Promise<AuthenticationToken[]>;

  @OneToMany(() => LicensePlate, it => it.account)
  public licensPlates: Promise<LicensePlate[]>;

  @OneToMany(() => Payment, it => it.account)
  public payments: Promise<Payment>;

}

import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuthenticationToken } from './authentication-token';
import { LicensePlate } from './license-plate';
import { Payment } from './payment';

@Entity({ name: 'account' })
export class Account {

  @Column({type: "varchar", primary: true, length: 50 })
  public email: string;

  @Column({ type: "tinyint", nullable: false })
  public isAdmin: boolean;

  @Column({type: "varchar" })
  public firstname: string;

  @Column({type: "varchar" })
  public lastname: string;

  @Column({type: "varchar" })
  public zip: string;

  @Column({type: "varchar" })
  public street: string;

  @Column({type: "varchar" })
  public streetNr: string;

  @Column({type: "varchar", nullable: false})
  public secret: string;

  @OneToMany(() => AuthenticationToken, it => it.owner)
  public jwts: Promise<AuthenticationToken[]>;

  @OneToMany(() => LicensePlate, it => it.account)
  public licensPlates: Promise<LicensePlate[]>;

  @OneToMany(() => Payment, it => it.account)
  public payments: Promise<Payment>;

}

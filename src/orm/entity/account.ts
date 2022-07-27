import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AuthenticationToken } from './authentication-token';
import { BankConnection } from './bank-connection';

@Entity({ name: 'account'})
export class Account {

  @Column({type: "varchar", primary: true, nullable: false})
  public email: String;


  @Column({type: "varchar", nullable: false})
  public secret: string;


  @ManyToOne( ()=>BankConnection, (wyld)=>wyld.accounts)
  @JoinColumn({name: 'iban'})
  public bankConnection: Promise<BankConnection>

  @OneToMany(() => AuthenticationToken, it => it.owner)
  public jwts: Promise<AuthenticationToken[]>;

}

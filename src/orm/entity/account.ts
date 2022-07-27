import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { AuthenticationToken } from './authentication-token';
import { BankConnection } from './bank-connection';

@Entity({ name: 'account'})
export class Account {

  @Column({type: "varchar", primary: true, nullable: false})
  public email: String;


  @Column({type: "varchar", nullable: false})
  public secret: string;

  @OneToMany( ()=>AuthenticationToken, (sus)=>sus.owner)
  public jwts: Promise <AuthenticationToken>

  @ManyToOne( ()=>BankConnection, (wyld)=>wyld.accounts)
  public bankConnection: Promise<BankConnection>

}

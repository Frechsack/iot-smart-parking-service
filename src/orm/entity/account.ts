import { Entity, Column } from 'typeorm';

@Entity({ name: 'account'})
export class Account {

  @Column({type: 'varchar', primary: true})
  public email: String;

}

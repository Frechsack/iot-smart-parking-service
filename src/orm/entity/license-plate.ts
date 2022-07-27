import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Account } from './account';
import { LicensePlatePhoto } from './license-plate-photo';
import { Payment } from './payment';

@Entity({ name: 'license_plate'})
export class LicensePlate {

  @Column({ type: 'varchar', primary: true })
  public plate: string;

  @ManyToOne(() => Account, it => it.licensPlates, { nullable: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'account_email'})
  public account: Promise<Account>;

  @OneToMany(() => LicensePlatePhoto, it => it.licensePlate)
  public photos: Promise<LicensePlatePhoto[]>;

  @OneToMany(() => Payment, it => it.licensePlate)
  public payments: Promise<Payment[]>;

  /**
  * relation-id
  */
  @Column({ name: 'account_email' })
  private _accountEmail: string;

  public get accountEmail(): string {
    return this._accountEmail;
  }
}

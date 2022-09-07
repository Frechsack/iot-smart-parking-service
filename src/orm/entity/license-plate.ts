import { Entity, Column, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
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
}

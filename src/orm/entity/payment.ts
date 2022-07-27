import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Account } from "./account";
import { LicensePlate } from "./license-plate";

@Entity({ name: 'payment' })
export class Payment {

  @Column({ type: 'datetime', primary: true})
  public from: Date;

  @Column({ type: 'datetime', primary: true})
  public to: Date;

  @Column({ type: 'double', nullable: false})
  public price: number;

  @ManyToOne(() => Account, it => it.payments, { nullable: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'account_email' })
  public account: Promise<Account>;

  @ManyToOne(() => LicensePlate, it => it.payments, { nullable: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'license_plate_plate' })
  public licensePlate: Promise<LicensePlate>;

  /**
  * relation-id
  */
  @Column({ primary: true, name: 'account_email' })
  private _accountEmail: string;

  /**
  * relation-id
  */ 
  @Column({ primary: true, name: 'license_plate_plate' })
  private _licensePlateplate: string;

  public get accountEmail(): string{
    return this._accountEmail;
  }

  public get licensePlateplate(): string{
    return this._licensePlateplate;
  }

}

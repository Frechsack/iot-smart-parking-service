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
  @JoinColumn({ name: 'email' })
  public account: Promise<Account>;

  @ManyToOne(() => LicensePlate, it => it.payments, { nullable: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'plate' })
  public licensePlate: Promise<LicensePlate>;

  @Column({ primary: true, name: 'email' })
  private _email: string;

  @Column({ primary: true, name: 'plate' })
  private _plate: string;

  public get email(): string{
    return this._email;
  }

  public get plate(): string{
    return this._plate;
  }

}

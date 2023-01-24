import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Account } from "./account";
import { Device } from "./device";
import { LicensePlate } from "./license-plate";
import { ParkingLot } from "./parking-lot";
import { Zone } from "./zone";

@Entity({ name: 'capture' })
export class Capture {

   @Column({ type: 'varchar', primary: true, name: 'device_name'})
  public deviceName: string;

  @Column({ type: 'int'})
  public width: number;

  @Column({ type: 'int'})
  public height: number;

  @Column({ type: 'int'})
  public x: number;

  @Column({ type: 'int'})
  public y: number;

  @OneToMany(() => Zone, it => it.capture)
  public zones: Promise<Zone[]>;
}
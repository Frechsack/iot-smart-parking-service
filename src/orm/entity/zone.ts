import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Account } from "./account";
import { Capture } from "./capture";
import { Device } from "./device";
import { LicensePlate } from "./license-plate";
import { ParkingLot } from "./parking-lot";

@Entity({ name: 'zone' })
export class Zone {

  @Column({ type: 'int', primary: true})
  public nr: number;

  @Column({ type: 'int'})
  public width: number;

  @Column({ type: 'int'})
  public height: number;

  @Column({ type: 'int'})
  public offSetX: number;

  @Column({ type: 'int'})
  public offSetY: number;

  @OneToMany(() => Device, it => it.zone)
  public devices: Promise<Device[]>;

  @OneToMany(()=>ParkingLot, it => it.zone)
  public parkingLots: Promise<ParkingLot[]>;

  @ManyToOne(() => Capture, it => it.zones)
  @JoinColumn({ name: 'device_name' })
  public capture: Promise<Capture>;
}
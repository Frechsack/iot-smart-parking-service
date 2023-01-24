import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Capture } from "./capture";
import { Device } from "./device";
import { ParkingLot } from "./parking-lot";

@Entity({ name: 'zone' })
export class Zone {

  @Column({ type: 'int', primary: true})
  public nr: number;

  @Column({ type: 'int'})
  public width: number;

  @Column({ type: 'int'})
  public height: number;

  @Column({ type: 'int', name: 'offset_x'})
  public offSetX: number;

  @Column({ type: 'int', name: 'offset_y'})
  public offSetY: number;

  @OneToMany(() => Device, it => it.zone)
  public devices: Promise<Device[]>;

  @OneToMany(()=>ParkingLot, it => it.zone)
  public parkingLots: Promise<ParkingLot[]>;

  @ManyToOne(() => Capture, it => it.zones, { nullable: false })
  @JoinColumn({ name: 'device_name' })
  public capture: Promise<Capture>;
}
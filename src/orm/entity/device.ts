import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DeviceInstruction } from "./device-instruction";
import { DeviceStatus } from "./device-status";
import { DeviceType } from "./device-type";
import { ParkingLot } from "./parking-lot";

@Entity({ name: 'device' })
export class Device {

  @Column({ type: 'varchar', primary: true })
  public mac: string;

  @ManyToOne(() => DeviceType, it => it.devices, { nullable: false })
  @JoinColumn({ name: 'device_type_name' })
  public type: Promise<DeviceType>;

  @ManyToOne(() => ParkingLot, it => it.devices, { nullable: true })
  @JoinColumn({ name: 'parking_lot_nr' })
  public parkingLot: Promise<ParkingLot | null>;

  @OneToMany(() => DeviceStatus, it => it.device)
  public status: Promise<DeviceStatus[]>

  @OneToMany(() => DeviceInstruction, it => it.device)
  public instructions: Promise<DeviceInstruction[]>

  @OneToMany(() => Device, it => it.parent)
  public children: Promise<Device[]>;

  @ManyToOne(() => Device, it => it.children, { nullable: true })
  @JoinColumn({ name : 'parent_mac'})
  public parent: Promise<Device | null>;
}

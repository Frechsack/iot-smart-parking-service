import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DeviceInstruction } from "./device-instruction";
import { DeviceStatus } from "./device-status";
import { DeviceType } from "./device-type";
import { ParkingLot } from "./parking-lot";
import { Zone } from "./zone";

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

  @ManyToOne(() => Zone, it => it.devices, {nullable: true})
  @JoinColumn({ name: 'zone_nr' })
  public zone: Promise<Zone|null>;
}

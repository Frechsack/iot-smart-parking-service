import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Device } from "./device";
import { Zone } from "./zone";

@Entity({ name: 'parking_lot'})
export class ParkingLot {

  @Column({ type: 'integer', primary: true })
  public nr: number;

  @OneToMany(() => Device, it => it.parkingLot )
  public devices: Promise<Device[]>;

  @ManyToOne(() => Zone, it => it.parkingLots)
  @JoinColumn({ name: 'zone_nr' })
  public zone: Promise<Zone|null>;
}

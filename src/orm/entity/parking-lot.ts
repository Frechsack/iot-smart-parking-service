import { Column, Entity, OneToMany } from "typeorm";
import { Device } from "./device";

@Entity({ name: 'parking_lot'})
export class ParkingLot {

  @Column({ type: 'integer', primary: true })
  public nr: number;

  @OneToMany(() => Device, it => it.parkingLot )
  public devices: Promise<Device[]>;

}

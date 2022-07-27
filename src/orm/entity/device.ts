import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
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

  /**
  * relation-id
  */
  @Column({ name: 'device_type_name' })
  private _deviceTypeName: string;

  /**
  * relation-id
  */
  @Column({ name: 'parking_lot_nr' })
  private _parkingLotNr: string;

  public get parkingLotNr(): string {
    return this._parkingLotNr;
  }

  public get deviceTypeName(): string {
    return this._deviceTypeName;
  }
}

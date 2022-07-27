import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { DeviceType } from "./device-type";

@Entity({ name: 'device' })
export class Device {

  @Column({ type: 'varchar', primary: true })
  public mac: string;

  @ManyToOne(() => DeviceType, it => it.devices, { nullable: false })
  @JoinColumn({ name: 'type' })
  public type: Promise<DeviceType>;

  @Column({ name: 'type' })
  private _typeName: string;

  public get typeName(): string {
    return this._typeName;
  }
}

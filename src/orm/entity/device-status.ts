import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Device } from "./device";


@Entity({ name: 'device_status'})
export class DeviceStatus{

  @Column({ type: 'varchar', nullable: false})
  public status: string;

  @Column({ type: 'datetime', primary: true})
  public date: Date;

  @ManyToOne(() => Device, it => it.status)
  @JoinColumn({ name: 'device_mac'})
  public device: Promise<Device>;

  @Column({ name: 'device_mac', primary: true})
  private _deviceMac: string;


}

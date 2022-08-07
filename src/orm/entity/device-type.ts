import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Device } from "./device";

export enum DeviceTypeName {
  LAMP='LAMP',
  PARKING_GUIDE_LAMP='PARKING_GUIDE_LAMP',
  CWO_SENSOR='CWO_SENSOR',
  SERVO='SERVO'
}

export function valueOf(name: string): DeviceTypeName{
  return DeviceTypeName[name as keyof typeof DeviceTypeName];
}

@Entity({ name: 'device_type' })
export class DeviceType {

  @Column({ type: 'varchar', primary: true, update: false })
  public name: DeviceTypeName;

  @OneToMany(() => Device, it => it.type )
  public devices: Promise<Device[]>;

  @ManyToOne(() => DeviceType, it => it.children, { nullable: true })
  @JoinColumn({ name: 'parent_name' })
  public parent: Promise<DeviceType | null>;

  @OneToMany(() => DeviceType, it => it.parent)
  public children: Promise<DeviceType[]>;
}
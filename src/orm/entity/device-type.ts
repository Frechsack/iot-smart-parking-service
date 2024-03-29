import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Device } from "./device";

export enum DeviceTypeName {
  ENTER_BARRIER='ENTER_BARRIER',
  EXIT_BARRIER="EXIT_BARRIER",
  LAMP='LAMP',
  BARRIER='BARRIER',
  PARKING_GUIDE_LAMP='PARKING_GUIDE_LAMP',
  CWO_SENSOR='CWO_SENSOR',
  MOTION_SENSOR='MOTION_SENSOR',
  SPACE_DISPLAY='SPACE_DISPLAY',
  SPACE_ENTER_LIGHT='SPACE_ENTER_LIGHT',
  SPACE_EXIT_LIGHT='SPACE_EXIT_LIGHT',
  ALARM='ALARM'
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

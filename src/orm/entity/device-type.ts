import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Device } from "./device";

export enum DeviceTypeName {
  LAMP='LAMP',
  PARKING_GUIDE_LAMP='PARKING_GUIDE_LAMP',
  CWO_SENSOR='CWO_SENSOR',
  SERVO='SERVO'
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

  /**
  * relation-id
  */
  @Column({ name: 'parent_name', nullable: true })
  public readonly  parentName: string | null;

}

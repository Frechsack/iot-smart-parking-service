import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LicensePlate } from './license-plate';
import { LicensePlatePhotoType } from './license-plate-photo-type';

@Entity({ name: 'license_plate_photo' })
export class LicensePlatePhoto {

  @Column({ type: 'longblob', nullable: false})
  public image: Uint8Array;

  @Column({ type: 'datetime', nullable: false})
  public date: Date;

  @ManyToOne(() => LicensePlate, it => it.photos, { nullable: false })
  @JoinColumn({ name: 'plate' })
  public licensePlate: Promise<LicensePlate>;

  @ManyToOne(() => LicensePlatePhotoType, it => it.photos, { nullable: false })
  @JoinColumn({ name: 'type' })
  public type: Promise<LicensePlatePhotoType>;

  /**
  * relation-id
  */
  @Column({ primary: true, name: 'plate' })
  private _plate: string;

  /**
  * relation-id
  */
  @Column({ name: 'type' })
  private _typeName: string;

  public get plate(): string {
    return this._plate;
  }

  public get typeName(): string {
    return this._typeName;
  }
}

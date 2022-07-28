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
  @JoinColumn({ name: 'license_plate' })
  public licensePlate: Promise<LicensePlate>;

  @ManyToOne(() => LicensePlatePhotoType, it => it.photos, { nullable: false })
  @JoinColumn({ name: 'license_plate_photo_type' })
  public type: Promise<LicensePlatePhotoType>;

  /**
  * relation-id
  */
  @Column({ primary: true, name: 'license_plate', nullable: false })
  public readonly licensePlatePlate: string;

  /**
  * relation-id
  */
  @Column({ name: 'license_plate_photo_type', nullable: false })
  public readonly typeName: string;
}

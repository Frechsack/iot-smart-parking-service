import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LicensePlate } from './license-plate';
import { LicensePlatePhotoType } from './license-plate-photo-type';

@Entity({ name: 'license_plate_photo' })
export class LicensePlatePhoto {

  @Column({ type: 'longblob', nullable: false })
  public image: Uint8Array;

  @Column({ type: 'datetime', primary: true })
  public date: Date;

  @ManyToOne(() => LicensePlate, it => it.photos, { nullable: false })
  @JoinColumn({ name: 'license_plate' })
  public licensePlate: Promise<LicensePlate>;

  @ManyToOne(() => LicensePlatePhotoType, it => it.photos, { nullable: false })
  @JoinColumn({ name: 'license_plate_photo_type' })
  public type: Promise<LicensePlatePhotoType>;

  @Column({ primary: true, name: 'license_plate' })
  private licensePlateKey: string;
}

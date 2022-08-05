import { Column, Entity, OneToMany } from "typeorm";
import { LicensePlatePhoto } from "./license-plate-photo";

export enum LicensePlatePhotoTypeName {
  ENTER='ENTER',
  EXIT='EXIT'
}

export function valueOf(name: string): LicensePlatePhotoTypeName{
  return LicensePlatePhotoTypeName[name as keyof typeof LicensePlatePhotoTypeName];
}

@Entity({ name: 'license_plate_photo_type' })
export class LicensePlatePhotoType {

  @Column({ type: 'varchar', primary: true, update: false, enum: LicensePlatePhotoTypeName })
  public name: LicensePlatePhotoTypeName;

  @OneToMany(() => LicensePlatePhoto, it => it.type)
  public photos: Promise<LicensePlatePhoto[]>;

}

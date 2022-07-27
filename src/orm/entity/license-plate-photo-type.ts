import { Column, Entity, OneToMany } from "typeorm";
import { LicensePlatePhoto } from "./license-plate-photo";

@Entity({ name: 'license_plate_photo_type' })
export class LicensePlatePhotoType {

  @Column({ type: 'varchar', primary: true, update: false })
  public name: LicensePlatePhotoTypeName;

  @OneToMany(() => LicensePlatePhoto, it => it.type)
  public photos: Promise<LicensePlatePhoto[]>;

}

export enum LicensePlatePhotoTypeName {
  ENTER='ENTER',
  EXIT='EXIT'
}

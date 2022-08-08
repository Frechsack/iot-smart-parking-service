import { LicensePlatePhotoTypeName } from "src/orm/entity/license-plate-photo-type";

export class DetectedLicensePlate {

  constructor(
    public readonly licensePlate: string,
    public readonly licensePlatePhotoPath: string,
    public readonly licensePlatePhotoType: LicensePlatePhotoTypeName
  ){}

}

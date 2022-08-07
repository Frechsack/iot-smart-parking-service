import { ViewColumn, ViewEntity } from "typeorm";
import { LicensePlatePhotoTypeName } from "./license-plate-photo-type";

@ViewEntity({
  name: 'license_plate_status',
  expression:
    `SELECT lp.license_plate as 'license_plate', lpp.\`date\` as \`date\`, lp.account_email as 'account_email', lpp.license_plate_photo_type as 'status'
     FROM (
     SELECT lp.plate as 'license_plate', MAX(lpp.\`date\`) as \`date\`, lp.account_email as 'account_email'
     FROM license_plate lp
     LEFT JOIN license_plate_photo lpp on lpp.license_plate = lp.plate
     group by lp.plate
     ) lp
     left JOIN license_plate_photo lpp on lpp.\`date\` = lp.\`date\` and lpp.license_plate = lp.license_plate`
  })
export class LicensePlateStatus {

  @ViewColumn({ name: 'license_plate' })
  public licensePlate: string;

  @ViewColumn({ name: 'date' })
  public date: Date | null;

  @ViewColumn({ name: 'account_email' })
  public email: string;

  @ViewColumn({ name: 'status' })
  public status: LicensePlatePhotoTypeName | null;
}

import { ViewColumn, ViewEntity } from "typeorm";


@ViewEntity({
  name: 'parking_lot_status',
  expression:
    `SELECT sub.nr as 'nr', sub.\`date\` as 'date', ds.status as 'status'
    FROM (
      select pl.nr as 'nr', MAX(d.mac) as 'device_mac', MAX(ds.\`date\`) as 'date'
      FROM parking_lot pl
      left join device d on d.parking_lot_nr = pl.nr and d.device_type_name = 'MOTION_SENSOR'
      left join device_status ds on ds.device_mac = d.mac
      group by pl.nr
    ) sub
    left join device_status ds on ds.device_mac = sub.device_mac and ds.\`date\` = sub.\`date\``
  })
export class ParkingLotStatus {

  @ViewColumn({ name: 'nr' })
  public nr: number;

  @ViewColumn({ name: 'date' })
  public date: Date | null;

  @ViewColumn({ name: 'status' })
  public status: string | null;
}

import { ViewColumn, ViewEntity } from "typeorm";


@ViewEntity({
  name: 'parking_lot_guiding_devices',
  expression:
    `
    SELECT d.mac as 'mac',d.parking_lot_nr as 'nr', CONCAT_WS(',',d1.mac,d2.mac,d3.mac,d4.mac,d5.mac,d6.mac) as 'parents'
    FROM device d
    LEFT JOIN device d1 ON d1.mac = d.parent_mac
    LEFT JOIN device d2 ON d2.mac = d1.parent_mac
    LEFT JOIN device d3 ON d3.mac = d2.parent_mac
    LEFT JOIN device d4 ON d4.mac = d3.parent_mac
    LEFT JOIN device d5 ON d5.mac = d4.parent_mac
    LEFT JOIN device d6 ON d6.mac = d5.parent_mac
    WHERE d.device_type_name = 'PARKING_GUIDE_LAMP' and d.parking_lot_nr is not null
    GROUP BY d.mac
    `
  })
export class ParkingLotGuidingDevices {

  @ViewColumn({ name: 'nr' })
  public nr: number;

  @ViewColumn({ name: 'parents', transformer: {
    from: (it: string) =>  {
      if(it == null || it === '' || (it.length == 1 && (it[0] == null || it[0] === ''))) return [];
      return it.split(';');
    },
    to: () => { throw new Error('Data can not be written.') }
  }})
  public parents: string[];

  @ViewColumn({ name: 'mac' })
  public mac: string;
}

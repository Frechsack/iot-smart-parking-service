import { ViewColumn, ViewEntity } from "typeorm";


@ViewEntity({
  name: 'device_children',
  expression:
    `SELECT d.mac as 'mac',
    CONCAT_WS(';',d1.mac,d2.mac,d3.mac,d4.mac,d5.mac,d6.mac,d7.mac,d8.mac,d9.mac,d10.mac,d11.mac,d12.mac,d13.mac,d14.mac,d15.mac,d16.mac,d17.mac,d18.mac,d19.mac) as 'children'
    FROM device d
    LEFT JOIN device d1 on d1.mac = d.parent_mac
    LEFT JOIN device d2 on d2.mac = d1.parent_mac
    LEFT JOIN device d3 on d3.mac = d2.parent_mac
    LEFT JOIN device d4 on d4.mac = d3.parent_mac
    LEFT JOIN device d5 on d5.mac = d4.parent_mac
    LEFT JOIN device d6 on d6.mac = d5.parent_mac
    LEFT JOIN device d7 on d7.mac = d6.parent_mac
    LEFT JOIN device d8 on d8.mac = d7.parent_mac
    LEFT JOIN device d9 on d9.mac = d8.parent_mac
    LEFT JOIN device d10 on d10.mac = d9.parent_mac
    LEFT JOIN device d11 on d11.mac = d10.parent_mac
    LEFT JOIN device d12 on d12.mac = d11.parent_mac
    LEFT JOIN device d13 on d13.mac = d12.parent_mac
    LEFT JOIN device d14 on d14.mac = d13.parent_mac
    LEFT JOIN device d15 on d15.mac = d14.parent_mac
    LEFT JOIN device d16 on d16.mac = d15.parent_mac
    LEFT JOIN device d17 on d16.mac = d16.parent_mac
    LEFT JOIN device d18 on d16.mac = d17.parent_mac
    LEFT JOIN device d19 on d16.mac = d18.parent_mac`
  })
export class DeviceChildren {

  @ViewColumn({ name: 'mac' })
  public mac: string;

  @ViewColumn({ name: 'children', transformer: {
    from: (it: string) =>  {
      if(it == null || it === '' || (it.length == 1 && (it[0] == null || it[0] === ''))) return [];
      return it.split(';');
    },
    to: () => { throw new Error('Data can not be written.') }
  }})
  public children: string[];
}

import { DeviceTypeName } from "src/orm/entity/device-type";

export class RegisterMessage {

  constructor(
    public readonly mac: string,
    public readonly deviceType: DeviceTypeName,
    public readonly parkingLotNr?: number,
    public readonly parentDeviceMac?: string
  ){}

  public static fromPayload(message: string): RegisterMessage {
    const items = message.split(':');
    if(items.length <= 1)
      throw new Error('Invalid message: ' + message);

    const mac: string = items[0].trim();
    const deviceType: DeviceTypeName =  DeviceTypeName[items[1].trim()];


    if(deviceType === undefined)
      throw new Error('Invalid deviceType: ' + items[1].trim());

    let parkingLotNr: number | undefined;
    try {
      if(items.length >= 2)
        parkingLotNr = undefined;
      else
        parkingLotNr = Number(items[2].trim())
    } catch(error) {

    }


    const parentDeviceMac = items.length >= 3 ? items[3].trim() : undefined;
    return new RegisterMessage(mac, deviceType, parkingLotNr, parentDeviceMac);
  }

}

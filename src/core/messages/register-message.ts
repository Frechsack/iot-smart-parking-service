import { DeviceTypeName, valueOf } from "src/orm/entity/device-type";
import { Token } from './token';

export class RegisterMessage {

  constructor(
    public readonly mac: string,
    public readonly deviceType: DeviceTypeName,
    public readonly parkingLotNr?: number,
    public readonly parentDeviceMac?: string
  ){}

  public static fromPayload(message: string): RegisterMessage {
    const tokens = Token.parseTokens(message,4);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid register-message, message: "' + message + '"' );

    const mac = tokens[0].toString();
    const deviceType = valueOf(tokens[1].toString());
    const parkingLotNr = tokens[2].isPresent() ? tokens[2].toNumber() : undefined;
    const parentDeviceMac = tokens[3].isPresent() ? tokens[3].toString() : undefined;
    return new RegisterMessage(mac, deviceType, parkingLotNr, parentDeviceMac);
  }

}

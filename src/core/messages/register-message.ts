import { DeviceTypeName, valueOf } from "src/orm/entity/device-type";
import { Message, MessageSource } from "./message";
import { Token } from './token';

export class RegisterMessage extends Message {

  constructor(
    public readonly mac: string,
    public readonly deviceType: DeviceTypeName,
    source: MessageSource,
    public readonly parkingLotNr?: number,
    public readonly parentDeviceMac?: string
  ){
    super(source);
  }

  public static fromPayload(message: string, source: MessageSource,): RegisterMessage {
    const tokens = Token.parseTokens(message,4);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid register-message, message: "' + message + '"' );

    const mac = tokens[0].toString();
    const deviceType = valueOf(tokens[1].toString());
    const parkingLotNr = tokens[2].isPresent() ? tokens[2].toNumber() : undefined;
    const parentDeviceMac = tokens[3].isPresent() ? tokens[3].toString() : undefined;
    return new RegisterMessage(mac, deviceType, source, parkingLotNr, parentDeviceMac);
  }

}

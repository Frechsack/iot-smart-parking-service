import { DeviceTypeName, valueOf } from "src/orm/entity/device-type";
import { Message, MessageSource } from "./message";
import { Token } from './token';

/**
* Nachricht auf "register"-lane.
*/
export class RegisterMessage extends Message {

  constructor(
    /**
    * Die mac des zu registrierenden Geräts.
    */
    public readonly mac: string,

    /**
    * Der Gerätetyp des zu registrierenden Geräts.
    */
    public readonly deviceType: DeviceTypeName,

    /**
    * Die Quelle dieser Nachricht.
    */
    source: MessageSource,

    /**
    * Die optionale Parkplatznummer des zu registrierenden Geräts.
    */
    public readonly parkingLotNr?: number,

    /**
    * Die optionale mac des übergeordneten Geräts des zu registrierenden Geräts.
    */
    public readonly parentDeviceMac?: string
  ){
    super(source);
  }

  /**
  * Erstellt eine Message aus einer Textnachricht.
  * @param message Die umzuwandelnde Textnachricht.
  * @param source Die Quelle dieser Textnachricht.
  * @returns Gibt die umgewandelte Nachricht zurück.
  */
  public static fromPayload(message: string, source: MessageSource): RegisterMessage {
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

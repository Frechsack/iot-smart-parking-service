import { Message, MessageSource } from "./message";
import { Token } from "./token";

/**
* Nachricht auf "status"-lane.
*/
export class StatusMessage<E> extends Message {

  constructor(
    /**
    * Die mac des Geräts, welches seinen Status übermittelt.
    */
    public readonly mac: string,

    /**
    * Der übermittelte Status des Geräts.
    */
    public readonly status: E,

    /**
    * Die Quelle dieses Geräts.
    */
    source: MessageSource
  ){
    super(source);
  }

  /**
  * Erstellt eine Message aus einer Textnachricht.
  * @param message Die umzuwandelnde Textnachricht.
  * @param source Die Quelle dieser Textnachricht.
  * @returns Gibt die umgewandelte Nachricht zurück.
  */
  public static fromPayload(message: string,source: MessageSource,): StatusMessage<any>{
    const tokens = Token.parseTokens(message,2);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid message: ' + message);

    const mac = tokens[0].toString();
    const status = tokens[1].toString();
    return new StatusMessage(mac,status,source);
  }

}

import { Message, MessageSource } from './message';
import { Token } from './token';

/**
* Nachricht auf "instruction"-lane.
*/
export class InstructionMessage<E> extends Message {

  constructor(
    /**
    * Die mac des Gerätes, welches eine Anweisung erhalten hat.
    */
    public readonly mac: string,

    /**
    * Die Auszuführende Anweisung.
    */
    public readonly instruction: E,

    /**
    * Die Quelle dieser Nachricht.
    */
    source: MessageSource

  ){
    super(source);
  }

  /**
  * Wandelt diese Nachricht eine per MQTT versendbare Textnachricht um.
  */
  public toMessage(){
    return `${this.mac}:${this.instruction}`;
  }

  /**
  * Erstellt eine Message aus einer Textnachricht.
  * @param message Die umzuwandelnde Textnachricht.
  * @param source Die Quelle dieser Textnachricht.
  * @returns Gibt die umgewandelte Nachricht zurück.
  */
  public static fromPayload(message: string, source: MessageSource): InstructionMessage<any>{
    const tokens = Token.parseTokens(message,2);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid instruction-message: "' + message + '"');

    const mac = tokens[0].toString();
    const instruction = tokens[1].toString();
    return new InstructionMessage(mac,instruction, source);
  }

}

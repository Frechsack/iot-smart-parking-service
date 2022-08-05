import { Message, MessageSource } from './message';
import { Token } from './token';

export class InstructionMessage<E> extends Message {

  constructor(
    public readonly mac: string,
    public readonly instruction: E,
    source: MessageSource

  ){
    super(source);
  }

  public static fromPayload(message: string, source: MessageSource): InstructionMessage<any>{
    const tokens = Token.parseTokens(message,2);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid message: ' + message);

    const mac = tokens[0].toString();
    const instruction = tokens[1].toString();
    return new InstructionMessage(mac,instruction, source);
  }

}

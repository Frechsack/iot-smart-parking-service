import { Token } from "./token";

export class StatusMessage<E> {

  constructor(
    public readonly mac: string,
    public readonly status: E
  ){}

  public static fromPayload(message: string): StatusMessage<any>{
    const tokens = Token.parseTokens(message,2);
    if(tokens[0].isEmpty() || tokens[1].isEmpty())
      throw new Error('Invalid message: ' + message);

    const mac = tokens[0].toString();
    const status = tokens[1].toString();
    return new StatusMessage(mac,status);
  }

}

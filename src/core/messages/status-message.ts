export class StatusMessage<E> {

  constructor(
    public readonly mac: string,
    public readonly status: E
  ){}

  public static fromPayload(message: string): StatusMessage<any>{
    const items = message.split(':');
    if(items.length !== 2)
      throw new Error('Invalid message: ' + message);
    return new StatusMessage(items[0].trim(),items[1].trim());
  }

}

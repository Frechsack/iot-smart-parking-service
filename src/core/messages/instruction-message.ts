export class InstructionMessage<E> {

  constructor(
    public readonly mac: string,
    public readonly instruction: E
  ){}

  public static fromPayload(message: string): InstructionMessage<any>{
    const items = message.split(':');
    if(items.length !== 2)
      throw new Error('Invalid message: ' + message);
    return new InstructionMessage(items[0].trim(),items[1].trim());
  }

}

export enum MessageSource {
  EXTERNAL='EXTERNAL',
  INTERNAL='INTERNAL'
}


export class Message {

  constructor(
    private readonly source: MessageSource
  ){
  }

  public isInternalMessage(): boolean {
    return this.source === MessageSource.INTERNAL;
  }

  public isExternalMessage(): boolean {
    return this.source === MessageSource.EXTERNAL;
  }
}

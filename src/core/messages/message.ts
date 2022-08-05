
/**
* Die Quelle für Nachrichten.
*/
export enum MessageSource {

  /**
  * Die Nachricht wurde von extern gesendet und wurde von uns empfangen.
  */
  EXTERNAL='EXTERNAL',

  /**
  * Die Nachricht wurde von uns gesendet.
  */
  INTERNAL='INTERNAL'
}

/**
* Basisklasse für Nachrichten.
*/
export class Message {

  constructor(
    /**
    * Die Quelle dieser Nachricht.
    */
    private readonly source: MessageSource
  ){
  }

  /**
  * Prüft ob diese Nachricht aus einer internen Quelle stammt.
  */
  public isInternalMessage(): boolean {
    return this.source === MessageSource.INTERNAL;
  }

  /**
  * Prüft ob diese Nachricht aus einer externen Quelle stammt.
  */
  public isExternalMessage(): boolean {
    return this.source === MessageSource.EXTERNAL;
  }
}

import { Message, MessageSource } from "./message";

/**
* Nachricht auf "scan"-lane. Diese Nachricht ist leer.
*/
export class ScanMessage extends Message {
  constructor(
    /**
    * Die Quelle dieser Nachricht.
    */
    source: MessageSource
  ){
    super(source);
  }
}

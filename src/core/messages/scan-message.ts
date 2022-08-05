import { Message, MessageSource } from "./message";

export class ScanMessage extends Message {
  constructor(
    source: MessageSource
  ){
    super(source);
  }
}

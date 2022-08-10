export class DeviceInstructionDto {
  constructor(
    public readonly deviceMac: string,
    public readonly instruction: string,
    public readonly date: Date
  ){
  }
}

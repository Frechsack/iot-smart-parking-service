export class DeviceInstructionDto {
  // TODO: Attribute ergänzen: deviceMac, instruction, date (Siehe DeviceStatusDto)
  constructor(
    public readonly deviceMac: string,
    public readonly instruction: string,
    public readonly date: Date
  ){
  }
}

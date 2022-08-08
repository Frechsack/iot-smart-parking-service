export class DeviceStatusDto {
  constructor(
    public readonly deviceMac: string,
    public readonly status: string,
    public readonly date: Date
  ){
  }

}

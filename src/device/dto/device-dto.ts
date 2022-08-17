import { DeviceTypeName } from "src/orm/entity/device-type";

export class DeviceDto {
  constructor(
    public readonly mac: string,
    public readonly type: DeviceTypeName,
    public readonly parkingLotNr?: number,
    public readonly parentMac?: string
  ){
  }
}

export class ParkingLotDto {
  constructor(
    public readonly nr: number,
    public readonly isAvailable: boolean
  ){}
}

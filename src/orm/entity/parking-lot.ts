import { Column, Entity } from "typeorm";

@Entity({ name: 'parking_lot'})
export class ParkingLot {

  @Column({ type: 'integer', primary: true })
  public nr: number;

}

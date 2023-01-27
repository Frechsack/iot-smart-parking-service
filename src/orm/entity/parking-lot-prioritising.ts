import { Entity, Column, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Account } from './account';
import { LicensePlatePhoto } from './license-plate-photo';
import { ParkingLot } from './parking-lot';
import { Payment } from './payment';
import { Zone } from './zone';

@Entity({ name: 'parking_lot_prioritising'})
export class ParkingLotPrioritising {

  @ManyToOne(() => Zone, it => it.parkingLotPriorisations, {nullable:false})
  @JoinColumn({name: 'zone_nr'})
  public zone: Promise<Zone>;

  @ManyToOne(() => ParkingLot, it => it.parkingLotPriorisations, {nullable:false})
  @JoinColumn({ name: 'parking_lot_nr'})
  public parkingLot: Promise<ParkingLot>;

  @Column({ type: 'int', nullable: false, primary: true })
  public prio: number;

  @Column({primary: true, name: 'zone_nr'})
  private zoneKey: number;


  @Column({primary: true, name: 'parking_lot_nr'})
  private parkingLotKey: number;
}
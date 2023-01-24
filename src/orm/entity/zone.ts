import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Capture } from "./capture";
import { Device } from "./device";
import { ParkingLot } from "./parking-lot";
import { ParkingLotPrioritising } from "./parking-lot-prioritising";
import { ZoneRouting } from "./zone-routing";

@Entity({ name: 'zone' })
export class Zone {

  @Column({ type: 'int', primary: true})
  public nr: number;

  @Column({ type: 'int'})
  public width: number;

  @Column({ type: 'int'})
  public height: number;

  @Column({ type: 'int', name: 'offset_x'})
  public offSetX: number;

  @Column({ type: 'int', name: 'offset_y'})
  public offSetY: number;

  @OneToMany(() => Device, it => it.zone)
  public devices: Promise<Device[]>;

  @OneToMany(()=>ParkingLot, it => it.zone)
  public parkingLots: Promise<ParkingLot[]>;

  @ManyToOne(() => Capture, it => it.zones, { nullable: false })
  @JoinColumn({ name: 'device_name' })
  public capture: Promise<Capture>;


  @OneToMany(() => ParkingLotPrioritising, it => it.zone)
  public parkingLotPriorisations: Promise<ParkingLotPrioritising[]>;

  @OneToMany(() => ZoneRouting, it => it.from)
  public routingFrom: Promise<ZoneRouting[]>;

  @OneToMany(() => ZoneRouting, it => it.to)
  public routingTo: Promise<ZoneRouting[]>;

  @OneToMany(() => ZoneRouting, it => it.next)
  public routingNext: Promise<ZoneRouting[]>;

}
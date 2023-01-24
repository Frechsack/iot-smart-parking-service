import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Account } from "./account";
import { LicensePlate } from "./license-plate";
import { Zone } from "./zone";

@Entity({ name: 'zone_routing' })
export class ZoneRouting {


    @ManyToOne(() => Zone, it => it.routingFrom)
    @JoinColumn({ name: 'from_nr' })
    public from: Promise<Zone>;

    @ManyToOne(() => Zone, it => it.routingTo)
    @JoinColumn({ name: 'to_nr' })
    public to: Promise<Zone>;

    @ManyToOne(() => Zone, it => it.routingNext)
    @JoinColumn({ name: 'next_nr' })
    public next: Promise<Zone>;

    @Column({primary: true, name: 'from_nr'})
    private fromKey: number;


    @Column({primary: true, name: 'to_nr'})
    private toKey: number;

    @Column({primary: true, name: 'next_nr'})
    private nextKey: number;
}

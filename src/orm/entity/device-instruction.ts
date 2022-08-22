import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Device } from "./device";

@Entity({ name: "device_instruction"})
export class DeviceInstruction {

  @Column({type:  "datetime", primary: true} )
  public date: Date;

  @Column({ type: 'varchar', nullable: false, transformer: {
    from: (it: string) => it.toLowerCase(),
    to: (it: string) => it.toLowerCase()
  }})
  public instruction: string;

  @ManyToOne(()=> Device, it => it.instructions)
  @JoinColumn({ name: 'device_mac'})
  public device: Promise<Device>

  @Column({ name: 'device_mac', primary: true })
  private deviceKey: string;
}

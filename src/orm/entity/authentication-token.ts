import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account';

@Entity({name: "authentication_token"})
export class AuthenticationToken {

    @Column({type: 'datetime', nullable: false })
    public created: Date;

    @Column({type: "datetime", nullable: false })
    public expires: Date;

    @Column({type: "varchar", primary: true })
    public jwt: string;

    @ManyToOne(() => Account, it => it.jwts, { nullable: false, createForeignKeyConstraints: false })
    @JoinColumn({ name: 'account_email'})
    public owner: Promise<Account>;

    /**
    * relation-id
    */
    @Column({ name: 'account_email' })
    private _accountEmail: string;

    public get accountEmail(): string {
      return this._accountEmail;
    }
}

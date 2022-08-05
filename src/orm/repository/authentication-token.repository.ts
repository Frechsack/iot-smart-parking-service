import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { AuthenticationToken } from "../entity/authentication-token";
import { AbstractRepository } from "./abstract.repository";

@Injectable()
export class AuthenticationTokenRepository extends AbstractRepository<AuthenticationToken> {

  constructor(
    @InjectRepository(AuthenticationToken)
    public readonly repository: Repository<AuthenticationToken>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): AuthenticationTokenRepository {
    return new AuthenticationTokenRepository(manager.getRepository(AuthenticationToken));
  }
}

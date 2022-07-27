import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
}

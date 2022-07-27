import { ObjectLiteral } from "typeorm";
import { Repository } from "typeorm/repository/Repository";

export class AbstractRepository<Entity extends ObjectLiteral> extends Repository<Entity>{

  constructor(native: Repository<Entity>){
    super(native.target, native.manager, native.queryRunner);
  }


}

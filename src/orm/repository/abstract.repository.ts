import { EntityManager, ObjectLiteral } from "typeorm";
import { Repository } from "typeorm/repository/Repository";

export class AbstractRepository<Entity extends ObjectLiteral> extends Repository<Entity>{

  constructor(native: Repository<Entity>){
    super(native.target, native.manager, native.queryRunner);
  }

  public async runTransaction<E>(runInTransaction: (entityManager: EntityManager) => Promise<E>): Promise<E> {
    return this.manager.transaction(runInTransaction);
  }
}

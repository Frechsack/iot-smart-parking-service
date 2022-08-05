import { EntityManager, ObjectLiteral } from "typeorm";
import { Repository } from "typeorm/repository/Repository";

/**
* Basisrepository für eigene Repositories.
*/
export class AbstractRepository<Entity extends ObjectLiteral> extends Repository<Entity>{

  constructor(native: Repository<Entity>){
    super(native.target, native.manager, native.queryRunner);
  }

  /**
  * Führt eine Transaktion aus.
  * @param runInTransaction Die auszuführende Transaktion in einer Transaktion.
  * @returns Gibt das Ergenis der Transkationsfunktion zurück.
  */
  public async runTransaction<E>(runInTransaction: (entityManager: EntityManager) => Promise<E>): Promise<E> {
    return this.manager.transaction(runInTransaction);
  }
}

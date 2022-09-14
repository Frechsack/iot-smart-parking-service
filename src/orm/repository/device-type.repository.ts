import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DeviceType, DeviceTypeName } from '../entity/device-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceTypeRepository extends AbstractRepository<DeviceType> {

  private readonly defaults: { name: DeviceTypeName, parent?: DeviceTypeName }[] = [
    { name: DeviceTypeName.CWO_SENSOR },
    { name: DeviceTypeName.BARRIER },
    { name: DeviceTypeName.LAMP },
    { name: DeviceTypeName.ALARM },
    { name: DeviceTypeName.SPACE_DISPLAY },
    { name: DeviceTypeName.PARKING_GUIDE_LAMP, parent: DeviceTypeName.LAMP },
    { name: DeviceTypeName.MOTION_SENSOR },
    { name: DeviceTypeName.ENTER_BARRIER, parent: DeviceTypeName.BARRIER },
    { name: DeviceTypeName.EXIT_BARRIER, parent: DeviceTypeName.BARRIER },
    { name: DeviceTypeName.SPACE_EXIT_LIGHT, parent: DeviceTypeName.LAMP },
    { name: DeviceTypeName.SPACE_ENTER_LIGHT, parent: DeviceTypeName.LAMP }
  ];

  constructor(
    @InjectRepository(DeviceType)
    public readonly repository: Repository<DeviceType>
  ){
    super(repository);
  }

  /**
  * Erstellt eine Repository, welches in Transaktionen verwendet werden kann.
  * @param manager Der EntityManager, welcher die Transaktion durchführt.
  * @returns Gibt das zu verwendende Repository zurück.
  */
  public forTransaction(manager: EntityManager): DeviceTypeRepository {
    return new DeviceTypeRepository(manager.getRepository(DeviceType));
  }

  public async findOneByName(name: DeviceTypeName): Promise<DeviceType> {
    return (await this.findOneBy({name: name}))!;
  }

  public async insertDefaults(){
    const requiredDefaults = this.defaults
    // Sortiere - Entitäten ohne parent zuerst einfügen
    .sort((lhs, rhs) => (lhs.parent === undefined && rhs.parent === undefined) ? 0 : (lhs.parent === undefined ? -1 : 1));

    for(let missingType of requiredDefaults) {
      let deviceType = await this.findOneByName(missingType.name);
      if(deviceType != null) continue;

      deviceType = new DeviceType();
      deviceType.name = missingType.name;
      deviceType.parent = missingType.parent === undefined ? Promise.resolve(null) : Promise.resolve(await this.findOneByName(missingType.parent));
      await this.save(deviceType);
    }
  }
}

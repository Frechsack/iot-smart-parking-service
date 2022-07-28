import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceType, DeviceTypeName } from '../entity/device-type';
import { AbstractRepository } from './abstract.repository';

@Injectable()
export class DeviceTypeRepository extends AbstractRepository<DeviceType> {

  private readonly defaults: { name: DeviceTypeName, parent?: DeviceTypeName }[] = [
    { name: DeviceTypeName.CWO_SENSOR },
    { name: DeviceTypeName.SERVO },
    { name: DeviceTypeName.LAMP },
    { name: DeviceTypeName.PARKING_GUIDE_LAMP, parent: DeviceTypeName.LAMP }
  ];

  constructor(
    @InjectRepository(DeviceType)
    public readonly repository: Repository<DeviceType>
  ){
    super(repository);
    // TypeOrm benötigt eine kurze Zeit
    setTimeout(() => this.requireDefaults(),200);
  }

  private async requireDefaults(){
    const savedTypes = await this.find();
    const missingTypes = this.defaults
    // Nur Entitäen welche nicht in DB sind
    .filter(def => savedTypes.find(it => it.name === def.name && it.parentName == def.parent) === undefined)
    // Sortiere - Entitäten ohne parent zuerst einfügen
    .sort((lhs, rhs) => (lhs.parent === undefined && rhs.parent === undefined) ? 0 : (lhs.parent === undefined ? -1 : 1));
    
    for(let missingType of missingTypes) {
      const entity = new DeviceType();
      entity.name = missingType.name;
      entity.parent = missingType.parent === undefined ? Promise.resolve(null) : Promise.resolve(await this.findOneBy({ name: missingType.parent }));
      await this.save(entity);
    }
  }
}

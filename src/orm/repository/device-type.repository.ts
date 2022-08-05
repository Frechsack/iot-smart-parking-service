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

  public async findOneByName(name: DeviceTypeName): Promise<DeviceType> {
    return (await this.findOneBy({name: name}))!;
  }

  private async requireDefaults(){
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

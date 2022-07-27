import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Injectable } from '@nestjs/common';

@Injectable()
export class TypeOrmConfigurator implements TypeOrmOptionsFactory {

  constructor(private readonly configService: ConfigService){
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
      return {
        type: 'mysql',
        name: 'iot-smart-parking',
        host: this.configService.get('DATABASE_HOST'),
        port: this.configService.get('DATABASE_PORT'),
        username: this.configService.get('DATABASE_USER'),
        password: this.configService.get('DATABASE_PASSWORD'),
        database: this.configService.get('DATABASE_NAME'),
        entities: [ 'src/account/orm/*.ts', 'src/core/orm/*.ts', 'src/device/orm/*.ts' ],
        synchronize: true,
      };
    }
}

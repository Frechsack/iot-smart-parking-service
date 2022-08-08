import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'
import { DeviceModule } from './device/device.module';
import { AccountModule } from './account/account.module';
import { CoreModule } from './core/core.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/orm/entity/account';
import { OrmModule } from './orm/orm.module';
import { BankConnection } from './orm/entity/bank-connection';
import { AuthenticationToken } from './orm/entity/authentication-token';
import { LicensePlate } from './orm/entity/license-plate';
import { LicensePlatePhoto } from './orm/entity/license-plate-photo';
import { LicensePlatePhotoType } from './orm/entity/license-plate-photo-type';
import { Payment } from './orm/entity/payment';
import { ParkingLot } from './orm/entity/parking-lot';
import { DeviceType } from './orm/entity/device-type';
import { Device } from './orm/entity/device';
import { DeviceStatus } from './orm/entity/device-status';
import { DeviceInstruction } from './orm/entity/device-instruction';
import { PlateDetectionModule } from './plate-detection/plate-detection.module';
import { LicensePlateStatus } from './orm/entity/license-plate-status';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'etcuiaUanDEiuhjs61hjcvoijWQnjvcpq',
      database: 'iot-smart-parking',
      entities: [ Account,
          BankConnection,
          AuthenticationToken,
          LicensePlate,
          LicensePlatePhoto,
          LicensePlatePhotoType,
          Payment,
          ParkingLot,
          Device,
          DeviceType,
          DeviceStatus,
          DeviceInstruction,
          LicensePlateStatus
       ],
      synchronize: true
    }),
    DeviceModule,
    AccountModule,
    CoreModule,
    OrmModule,
    PlateDetectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

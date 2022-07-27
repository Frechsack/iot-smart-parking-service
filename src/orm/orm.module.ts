import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account';
import { AuthenticationToken } from './entity/authentication-token';
import { BankConnection } from './entity/bank-connection';
import { Device } from './entity/device';
import { DeviceType } from './entity/device-type';
import { LicensePlate } from './entity/license-plate';
import { LicensePlatePhoto } from './entity/license-plate-photo';
import { LicensePlatePhotoType } from './entity/license-plate-photo-type';
import { ParkingLot } from './entity/parking-lot';
import { Payment } from './entity/payment';
import { AccountRepository } from './repository/account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Account]),
            TypeOrmModule.forFeature([AuthenticationToken]),
            TypeOrmModule.forFeature([BankConnection]),
            TypeOrmModule.forFeature([LicensePlate]),
            TypeOrmModule.forFeature([LicensePlatePhoto]),
            TypeOrmModule.forFeature([LicensePlatePhotoType]),
            TypeOrmModule.forFeature([ParkingLot]),
            TypeOrmModule.forFeature([Payment]),
            TypeOrmModule.forFeature([DeviceType]),
            TypeOrmModule.forFeature([Device]),

          ],
  providers: [AccountRepository],
  exports: [ AccountRepository]
})
export class OrmModule {}

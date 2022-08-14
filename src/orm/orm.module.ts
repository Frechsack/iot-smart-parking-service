import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account';
import { AuthenticationToken } from './entity/authentication-token';
import { BankConnection } from './entity/bank-connection';
import { Device } from './entity/device';
import { DeviceInstruction } from './entity/device-instruction';
import { DeviceStatus } from './entity/device-status';
import { DeviceType } from './entity/device-type';
import { LicensePlate } from './entity/license-plate';
import { LicensePlatePhoto } from './entity/license-plate-photo';
import { LicensePlatePhotoType } from './entity/license-plate-photo-type';
import { LicensePlateStatus } from './entity/license-plate-status';
import { ParkingLot } from './entity/parking-lot';
import { ParkingLotStatus } from './entity/parking-lot-status';
import { Payment } from './entity/payment';
import { AccountRepository } from './repository/account.repository';
import { AuthenticationTokenRepository } from './repository/authentication-token.repository';
import { BankConnectionRepository } from './repository/bank-connection.repository';
import { DeviceInstructionRepository } from './repository/device-instruction.repository';
import { DeviceStatusRepository } from './repository/device-status.repository';
import { DeviceTypeRepository } from './repository/device-type.repository';
import { DeviceRepository } from './repository/device.repository';
import { LicensePlatePhotoTypeRepository } from './repository/license-plate-photo-type.repository';
import { LicensePlatePhotoRepository } from './repository/license-plate-photo.repository';
import { LicensePlateStatusRepository } from './repository/license-plate-status.repository';
import { LicensePlateRepository } from './repository/license-plate.repository';
import { ParkingLotStatusRepository } from './repository/parking-lot-status.repository';
import { ParkingLotRepository } from './repository/parking-lot.repository';
import { PaymentRepository } from './repository/payment.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Account]),
            TypeOrmModule.forFeature([AuthenticationToken]),
            TypeOrmModule.forFeature([BankConnection]),
            TypeOrmModule.forFeature([LicensePlate]),
            TypeOrmModule.forFeature([LicensePlateStatus]),
            TypeOrmModule.forFeature([LicensePlatePhoto]),
            TypeOrmModule.forFeature([LicensePlatePhotoType]),
            TypeOrmModule.forFeature([ParkingLot]),
            TypeOrmModule.forFeature([Payment]),
            TypeOrmModule.forFeature([DeviceType]),
            TypeOrmModule.forFeature([Device]),
            TypeOrmModule.forFeature([DeviceStatus]),
            TypeOrmModule.forFeature([DeviceInstruction]),
            TypeOrmModule.forFeature([ParkingLotStatus]),
          ],
  providers: [
    AccountRepository,
    AuthenticationTokenRepository,
    BankConnectionRepository,
    LicensePlateRepository,
    LicensePlatePhotoRepository,
    LicensePlatePhotoTypeRepository,
    ParkingLotRepository,
    PaymentRepository,
    DeviceRepository,
    DeviceTypeRepository,
    DeviceStatusRepository,
    DeviceInstructionRepository,
    LicensePlateStatusRepository,
    ParkingLotStatusRepository
  ],
  exports: [
    AccountRepository,
    AuthenticationTokenRepository,
    BankConnectionRepository,
    LicensePlateRepository,
    LicensePlatePhotoRepository,
    LicensePlatePhotoTypeRepository,
    ParkingLotRepository,
    PaymentRepository,
    DeviceRepository,
    DeviceTypeRepository,
    DeviceStatusRepository,
    DeviceInstructionRepository,
    LicensePlateStatusRepository,
    ParkingLotStatusRepository
  ],
})
export class OrmModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account';
import { AuthenticationToken } from './entity/authentication-token';
import { BankConnection } from './entity/bank-connection';
import { LicensePlate } from './entity/license-plate';
import { LicensePlatePhoto } from './entity/license-plate-photo';
import { AccountRepository } from './repository/account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Account]),
            TypeOrmModule.forFeature([AuthenticationToken]),
            TypeOrmModule.forFeature([BankConnection]),
            TypeOrmModule.forFeature([LicensePlate]),
            TypeOrmModule.forFeature([LicensePlatePhoto]),
          ],
  providers: [AccountRepository],
  exports: [ AccountRepository]
})
export class OrmModule {}

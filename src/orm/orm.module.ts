import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account';
import { AccountRepository } from './repository/account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountRepository],
  exports: [ AccountRepository]
})
export class OrmModule {}

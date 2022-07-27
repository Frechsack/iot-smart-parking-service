import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from 'src/orm/entity/account';
import { OrmModule } from 'src/orm/orm.module';
import { AccountService } from './service/account.service';

@Module({
  providers: [ AccountService ],
  imports:[ OrmModule ]
})
export class AccountModule {}

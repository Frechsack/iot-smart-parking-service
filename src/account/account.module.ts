import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from 'src/core/core.module';
import { Account } from 'src/orm/entity/account';
import { OrmModule } from 'src/orm/orm.module';
import { AuthenticationInterceptor } from './interceptor/authentication.interceptor';
import { AccountService } from './service/account.service';
import { JwtService } from './service/jwt.service';

@Module({
  providers: [ AccountService, JwtService, AuthenticationInterceptor ],
  imports:[ OrmModule, CoreModule ]
})
export class AccountModule {}

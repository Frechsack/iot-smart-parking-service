import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { OrmModule } from 'src/orm/orm.module';
import { AuthenticationInterceptor } from './interceptor/authentication.interceptor';
import { AccountService } from './service/account.service';
import { JwtService } from './service/jwt.service';
import { AccountController } from './controller/account.controller';
import { AdminAuthenticationInterceptor } from './interceptor/admin-authentication.interceptor';

@Module({
  providers: [ AccountService, JwtService, AuthenticationInterceptor, AdminAuthenticationInterceptor ],
  imports:[ OrmModule, CoreModule ],
  controllers: [AccountController],
  exports: [ AuthenticationInterceptor, AdminAuthenticationInterceptor, JwtService ]
})
export class AccountModule {}

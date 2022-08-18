import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { OrmModule } from 'src/orm/orm.module';
import { DeviceService } from './service/device.service';
import { DeviceController } from './controller/device.controller';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [ OrmModule, CoreModule, AccountModule ],
  providers: [ DeviceService ],
  controllers: [DeviceController]
})
export class DeviceModule {}

import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { OrmModule } from 'src/orm/orm.module';
import { DeviceService } from './service/device.service';

@Module({
  imports: [ OrmModule, CoreModule ],
  providers: [ DeviceService ]
})
export class DeviceModule {}

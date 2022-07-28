import { Module } from '@nestjs/common';
import { OrmModule } from 'src/orm/orm.module';
import { DeviceService } from './service/device.service';

@Module({
  imports: [ OrmModule ],
  providers: [ DeviceService ]
})
export class DeviceModule {}

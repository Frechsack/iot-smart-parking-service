import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AccountModule } from 'src/account/account.module';
import { CoreModule } from 'src/core/core.module';
import { DeviceModule } from 'src/device/device.module';
import { OrmModule } from 'src/orm/orm.module';
import { ParkingLotModule } from 'src/parking-lot/parking-lot.module';
import { PlateDetectionModule } from 'src/plate-detection/plate-detection.module';
import { WorkflowController } from './controller/workflow.controller';
import { WorkflowService } from './service/workflow.service';

@Module({
  imports: [ OrmModule, PlateDetectionModule, DeviceModule, CoreModule, ParkingLotModule, HttpModule, AccountModule ],
  providers: [ WorkflowService ],
  controllers:[WorkflowController]
})
export class WorkflowModule {}

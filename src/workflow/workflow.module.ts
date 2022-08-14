import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { DeviceModule } from 'src/device/device.module';
import { OrmModule } from 'src/orm/orm.module';
import { ParkingLotModule } from 'src/parking-lot/parking-lot.module';
import { PlateDetectionModule } from 'src/plate-detection/plate-detection.module';
import { WorkflowService } from './service/workflow.service';

@Module({
  imports: [ OrmModule, PlateDetectionModule, DeviceModule, CoreModule, ParkingLotModule ],
  providers: [ WorkflowService ]
})
export class WorkflowModule {}

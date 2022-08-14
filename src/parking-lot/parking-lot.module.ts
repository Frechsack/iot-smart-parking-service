import { Module } from '@nestjs/common';
import { OrmModule } from 'src/orm/orm.module';
import { ParkingLotController } from './controller/parking-lot.controller';
import { ParkingLotService } from './service/parking-lot.service';

@Module({
  imports: [ OrmModule ],
  controllers: [ ParkingLotController ],
  providers: [ ParkingLotService ],
  exports: [ ParkingLotService ]
})
export class ParkingLotModule {}

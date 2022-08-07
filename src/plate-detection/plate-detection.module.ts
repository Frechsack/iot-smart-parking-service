import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { OrmModule } from 'src/orm/orm.module';
import { PlateDetectionService } from './service/plate-detection.service';

@Module({
  imports: [ CoreModule, OrmModule ],
  providers: [ PlateDetectionService ],
  exports: [ PlateDetectionService ]
})
export class PlateDetectionModule {}

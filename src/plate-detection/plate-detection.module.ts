import { Module } from '@nestjs/common';
import { CoreModule } from 'src/core/core.module';
import { OrmModule } from 'src/orm/orm.module';
import { PlateDetectionService } from './service/plate-detection.service';
import { PlateDetectionController } from './controller/plate-detection.controller';

@Module({
  imports: [ CoreModule, OrmModule ],
  providers: [ PlateDetectionService ],
  exports: [ PlateDetectionService ],
  controllers: [PlateDetectionController]
})
export class PlateDetectionModule {}

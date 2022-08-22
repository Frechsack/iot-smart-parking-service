import { Module } from '@nestjs/common';
import { OrmModule } from 'src/orm/orm.module';
import { CommunicationService } from './service/communication.service';
import { LoggerService } from './service/logger.service';
import { UtilService } from './service/util.service';

@Module({
  imports: [OrmModule],
  providers: [ CommunicationService, LoggerService, UtilService ],
  exports: [ CommunicationService, LoggerService, UtilService ]
})
export class CoreModule {}

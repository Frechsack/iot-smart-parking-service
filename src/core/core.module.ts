import { Module } from '@nestjs/common';
import { CommunicationService } from './service/communication.service';
import { LoggerService } from './service/logger.service';

@Module({
  providers: [ CommunicationService, LoggerService ],
  exports: [ CommunicationService, LoggerService ]
})
export class CoreModule {}

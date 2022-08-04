import { Module } from '@nestjs/common';
import { CommunicationService } from './service/communication.service';
import { LoggerService } from './service/logger.service';

@Module({
  providers: [CommunicationService, LoggerService]
})
export class CoreModule {}

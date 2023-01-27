import { Controller, Query,  Put, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/core/service/logger.service';
import { WorkflowService } from '../service/workflow.service';


@Controller('workflow')
export class WorkflowController {

    constructor(
        public readonly service: WorkflowService,
        public readonly configService: ConfigService,
        private readonly loggerService: LoggerService
        ){
            loggerService.context = WorkflowController.name;
    }

    @Put('parking-guide')
    public async updateTakenZones(@Query('zones') zones: number[] | number, @Headers('key') key: string): Promise<void> {
        if(key === this.configService.get('SERVICE_UPDATE_KEY'))
            this.service.updateParkingGuide(Array.isArray(zones) ? zones : [zones]);
        else {
            this.loggerService.warn('Illegal access to /workflow/parking-guide. Wrong key.');
            return Promise.reject(new HttpException('Wrong key', HttpStatus.UNAUTHORIZED));
        }
            
    }
}
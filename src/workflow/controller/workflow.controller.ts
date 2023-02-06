import { Controller, Query,  Put, Headers, HttpException, HttpStatus, Get, Header, Res, UseInterceptors, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminAuthenticationInterceptor } from 'src/account/interceptor/admin-authentication.interceptor';
import { AUTHENTICATION_HEADER_TOKEN } from 'src/account/interceptor/authentication.interceptor';
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

    @Post('parking-guide')
    @UseInterceptors(AdminAuthenticationInterceptor)
    public async initOverwatch(): Promise<void> {
        await this.service.initOverwatch();
    }

    @Put('parking-guide')
    public async updateOverwatch(@Query('zones') zones: number[] | number, @Headers('key') key: string): Promise<void> {
        if(key === this.configService.get('SERVICE_KEY'))
            this.service.updateOverwatch(Array.isArray(zones) ? zones : [zones]);
        else {
            this.loggerService.warn('Illegal access to /workflow/parking-guide. Wrong key.');
            return Promise.reject(new HttpException('Wrong key', HttpStatus.UNAUTHORIZED));
        }       
    }

    @Get('parking-guide')
    @Header('content-type', 'image/jpeg')
    @UseInterceptors(AdminAuthenticationInterceptor)
    public async getComputedImage(@Res() res: any, @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string): Promise<any>{
        await this.service.saveComputedImageInStream(res);
    }
}
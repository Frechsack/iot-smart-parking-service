import { Controller, Get, Param, Query, UseInterceptors, Headers, HttpException, Post, Put, Delete } from '@nestjs/common';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { WorkflowService } from '../service/workflow.service';


@Controller('workflow')
export class WorkflowController {

@Put()
public async updateTakenZones(@Query('takenZones') takenZones: number[]): Promise<void>{
    this.service.updateParkingguide(takenZones);
}

constructor(public readonly service: WorkflowService){
}

  
}

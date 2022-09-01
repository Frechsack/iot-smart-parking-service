import { Controller, Param, Post } from '@nestjs/common';
import { PlateDetectionService } from '../service/plate-detection.service';

@Controller('plate-detection')
export class PlateDetectionController {

  constructor(
    private readonly plateDetectionService: PlateDetectionService
  ){}


  @Post('enter/:plate')
  public async enter(@Param('plate') plate: string){
    this.plateDetectionService.enter(plate);
  }

  @Post('exit/:plate')
  public async exit(@Param('plate') plate: string){
    this.plateDetectionService.enter(plate);
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ParkingLotService } from '../service/parking-lot.service';

@Controller('parking-lots')
export class ParkingLotController {

  constructor(
    private readonly parkingLotService: ParkingLotService
  ){
  }

  @Get(':nr/devices')
  public async getDevices(@Param('nr') nr: number, @Query('page') page: number = 0,@Query('pageSize') pageSize: number = 20): Promise<string[]>{
    return this.parkingLotService.getDevicesMac(nr,page,pageSize);
  }
}

import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { AdminAuthenticationInterceptor } from 'src/account/interceptor/admin-authentication.interceptor';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { ParkingLotDto } from '../dto/parking-lot-dto';
import { ParkingLotService } from '../service/parking-lot.service';

@Controller('parking-lots')
export class ParkingLotController {

  constructor(
    private readonly parkingLotService: ParkingLotService
  ){
  }

  @Get(':nr/devices')
  @UseInterceptors(AdminAuthenticationInterceptor)
  public async getDevices(@Param('nr') nr: number, @Query('page') page: number = 0,@Query('pageSize') pageSize: number = 20): Promise<string[]>{
    return this.parkingLotService.getDevicesMac(nr,page,pageSize);
  }

  @Get()
  public async get(): Promise<PaginationDto<ParkingLotDto>> {
    return this.parkingLotService.getParkingLots();
  }
}

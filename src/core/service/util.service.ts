import { Injectable } from '@nestjs/common';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { LicensePlateStatusRepository } from 'src/orm/repository/license-plate-status.repository';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { CommunicationService } from './communication.service';
import { LoggerService } from './logger.service';


@Injectable()
export class UtilService {

  private readonly latestServoStatusMap = new Map<string,Date>();

  constructor(
    private readonly parkingLotRepository: ParkingLotRepository,
    private readonly licensePlateStatusRepository: LicensePlateStatusRepository,
    private readonly loggerService: LoggerService,
    private readonly communicationService: CommunicationService
  ){
    this.loggerService.context = UtilService.name;
  }



  public async openServoForInterval(mac: string, intervalInSeconds = 10): Promise<void> {
    const funCloseServo = async (mac: string, closeAt: Date) => {
      const latestServoStatus = this.latestServoStatusMap.get(mac);
      if(latestServoStatus === closeAt)
        await this.communicationService.sendInstruction(mac, false);
    }

    const closeAt = new Date(Date.now() + intervalInSeconds * 1000);
    this.latestServoStatusMap.set(mac,closeAt);
    this.communicationService.sendInstruction(mac,true);
    setTimeout(async () => funCloseServo(mac,closeAt));
  }

  public async countAvailableParkingLots(){
      const parkingLots = await this.parkingLotRepository.count();
      const licensePlatesInUse = await this.licensePlateStatusRepository.count({ where: { status: LicensePlatePhotoTypeName.ENTER }});
      const availableParkingLots = parkingLots - licensePlatesInUse;
      if(availableParkingLots < 0)
        this.loggerService.error(`Amount of available parking-lots is negative, parking-lots: "${parkingLots}", license-plates-in-use": "${ licensePlatesInUse}"`);
      return availableParkingLots;
  }


}

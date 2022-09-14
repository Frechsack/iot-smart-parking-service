import { Injectable } from '@nestjs/common';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { LicensePlateStatusRepository } from 'src/orm/repository/license-plate-status.repository';
import { ParkingLotRepository } from 'src/orm/repository/parking-lot.repository';
import { CommunicationService } from './communication.service';
import { LoggerService } from './logger.service';
import { readFile, unlink } from 'fs';

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


  /**
  * Öffnet einen Servo für ein interval. Dazu wird sofort die Anweisung "true" an das Gerät gesendet.
  * Nach dem Interval die Anweisung "false", sollte der Servo zwischenzeitlich nicht erneut durch diese Funktion geöffnet worden sein.
  * @param mac Das zu öffnende Gerät.
  * @param intervalInSeconds Das Interval, für welches das Gerät geöffnet bleiben soll.
  */
  public async openServoForInterval(mac: string, intervalInSeconds = 15): Promise<void> {
    const funCloseServo = async (mac: string, closeAt: Date) => {
      const latestServoStatus = this.latestServoStatusMap.get(mac);
      if(latestServoStatus === closeAt)
        await this.communicationService.sendInstruction(mac, false);
    }

    const interval = intervalInSeconds * 1000;
    const closeAt = new Date(Date.now() + interval);
    this.latestServoStatusMap.set(mac,closeAt);
    this.communicationService.sendInstruction(mac,true);
    setTimeout(async () => funCloseServo(mac,closeAt),interval);
  }

  /**
  * Gibt die Anzahl an verfügbaren, nicht belegten Parkplätzen zurück.
  */
  public async countAvailableParkingLots(){
      const parkingLots = await this.parkingLotRepository.count();
      const licensePlatesInUse = await this.licensePlateStatusRepository.count({ where: { status: LicensePlatePhotoTypeName.ENTER }});
      const availableParkingLots = parkingLots - licensePlatesInUse;
      if(availableParkingLots < 0)
        this.loggerService.error(`Amount of available parking-lots is negative, parking-lots: "${parkingLots}", license-plates-in-use": "${ licensePlatesInUse}"`);
      return availableParkingLots;
  }


    /**
     * Preis calculation, jede Angefangene Stunde 1�
     * @param from Einfuhrdatum in das Parkhaus
     * @param to Ausfuhrdatum aus dem Parkhaus
     * @returns Preis f�r das Parken
     */
  public async calculatePrice(from: Date, to: Date): Promise<number>{
      const milis = to.getTime() - from.getTime();
      const secs = milis / 1000;
      const mins = secs / 60;
      const remainder = mins % 60;
      const hours = parseInt((mins / 60).toFixed(0));
      let priceaddon;
      if (remainder > 1) {
          priceaddon = 1;

      }else {
          priceaddon = 0;
          }

      return hours * 1 + priceaddon;
  }

  public async deleteFile(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      unlink(path,(error) => {
        if(error) reject(error);
        else resolve();
      });
    });
  }

  public async readFile(path: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      readFile(path,(error,data) => {
        if(error) reject(error);
        else resolve(data);
      });
    });
  }
}

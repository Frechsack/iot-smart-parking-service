import { Injectable } from '@nestjs/common';
import { filter } from 'rxjs';
import { CommunicationService } from 'src/core/service/communication.service';
import { LicensePlatePhotoType, LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { DetectedLicensePlate } from 'src/plate-detection/detected-license-plate';
import { PlateDetectionService } from 'src/plate-detection/service/plate-detection.service';
import { readFile, unlink } from 'fs';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlatePhotoRepository } from 'src/orm/repository/license-plate-photo.repository';
import { LicensePlatePhotoTypeRepository } from 'src/orm/repository/license-plate-photo-type.repository';
import { LicensePlatePhoto } from 'src/orm/entity/license-plate-photo';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { EntityManager } from 'typeorm';

const PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS = 30;

@Injectable()
export class WorkflowService {

  private latestEnterWorkflowStart?: Date;

  constructor(
    private readonly communicationService: CommunicationService,
    private readonly plateDetectionService: PlateDetectionService,
    private readonly licensePlatePhotoRepository: LicensePlatePhotoRepository,
    private readonly licensePlatePhotoTypeRepository: LicensePlatePhotoTypeRepository,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly loggerService: LoggerService
  ){
    this.loggerService.context = WorkflowService.name;

    this.plateDetectionService.detectedPlates
    .subscribe(async it => {
      if(it.licensePlatePhotoType === LicensePlatePhotoTypeName.ENTER)
        this.startEnterWorkflow(it);
      else
        this.startExitWorkflow(it);
    });
  }

  public async startEnterWorkflow(plate: DetectedLicensePlate): Promise<void> {
    const transaction = async (manager: EntityManager): Promise<void> => {
      const licensePlateRepository = this.licensePlateRepository.forTransaction(manager);
      const licensePlatePhotoTypeRepository = this.licensePlatePhotoTypeRepository.forTransaction(manager);


      // Bild auslesen & löschen
      this.loggerService.log('Enter-Workflow startet.');
      let image = await this.readFile(plate.licensePlatePhotoPath);
      this.deleteFile(plate.licensePlatePhotoPath).catch();

      const licensePlate = await licensePlateRepository.findOneByPlate(plate.licensePlate);
      if(licensePlate == null)
        throw new Error(`License-plate does not exists, plate: "${plate.licensePlate}"`);

      // Speicher Bild in DB
      let licensePlatePhoto = new LicensePlatePhoto();
      licensePlatePhoto.date = new Date();
      licensePlatePhoto.image = image;
      licensePlatePhoto.licensePlate = Promise.resolve(licensePlate);
      licensePlatePhoto.type = Promise.resolve((await licensePlatePhotoTypeRepository.findOneByName(LicensePlatePhotoTypeName.ENTER))!);
      licensePlatePhoto = await this.licensePlatePhotoRepository.save(licensePlatePhoto);

      // Starte Parkleitsystem für X-Sekunden




    }

    await this.licensePlateRepository.runTransaction(transaction);
  }

  public async startExitWorkflow(plate: DetectedLicensePlate){

  }

  private async enableParkingGuideSystem(isForced: boolean = false): Promise<void> {
    this.latestEnterWorkflowStart = new Date();
  }

  private async disableParkingGuideSystem(isForced: boolean = false): Promise<void> {
    if(!isForced) {
      const latestStart = this.latestEnterWorkflowStart!.getTime();
      const end = latestStart + PARKING_GUIDE_SYSTEM_RUNTIME_SECONDS * 1000;
      // Parkleitsystem läuft noch keine X Sekunden
      if(Date.now() <= end) return;
    }

    // Schalte alle entsprechenden Sensoren ab.

  }

  private async deleteFile(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      unlink(path,(error) => {
        if(error) reject(error);
        else resolve();
      });
    });
  }

  private async readFile(path: string): Promise<Uint8Array> {
    return new Promise(async (resolve, reject) => {
      readFile(path,(error,data) => {
        if(error) reject(error);
        else resolve(new Uint8Array(data.buffer));
      });
    });
  }
}

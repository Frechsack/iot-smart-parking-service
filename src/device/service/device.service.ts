import { Injectable } from '@nestjs/common';
import { DeviceInstructionRepository } from 'src/orm/repository/device-instruction.repository';
import { DeviceStatusRepository } from 'src/orm/repository/device-status.repository';
import { DeviceRepository } from 'src/orm/repository/device.repository';

@Injectable()
export class DeviceService {

  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly deviceStatusRepository: DeviceStatusRepository,
    private readonly deviceInstructionRepository: DeviceInstructionRepository) {
  }

}

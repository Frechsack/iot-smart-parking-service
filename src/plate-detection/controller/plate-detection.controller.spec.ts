import { Test, TestingModule } from '@nestjs/testing';
import { PlateDetectionController } from './plate-detection.controller';

describe('PlateDetectionController', () => {
  let controller: PlateDetectionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlateDetectionController],
    }).compile();

    controller = module.get<PlateDetectionController>(PlateDetectionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

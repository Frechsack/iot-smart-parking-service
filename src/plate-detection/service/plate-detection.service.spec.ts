import { Test, TestingModule } from '@nestjs/testing';
import { PlateDetectionService } from './plate-detection.service';

describe('PlateDetectionService', () => {
  let service: PlateDetectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlateDetectionService],
    }).compile();

    service = module.get<PlateDetectionService>(PlateDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

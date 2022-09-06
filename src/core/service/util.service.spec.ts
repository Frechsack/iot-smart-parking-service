import { Test, TestingModule } from '@nestjs/testing';
import { UtilService } from './util.service';

describe('UtilService', () => {
  let service: UtilService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilService],
    }).compile();

    service = module.get<UtilService>(UtilService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

    test('price', () => {
       


        expect(service.calculatePrice(new Date(2020, 9, 6, 15, 10), new Date(2020, 9, 6, 15, 25))).toEqual(1);
    })
});

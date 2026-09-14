import { Test, TestingModule } from '@nestjs/testing';
import { OnLineOffLineService } from './on-line-off-line.service.js';

describe('OnLineOffLineService', () => {
  let service: OnLineOffLineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnLineOffLineService],
    }).compile();

    service = module.get<OnLineOffLineService>(OnLineOffLineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

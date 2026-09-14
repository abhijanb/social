import { Test, TestingModule } from '@nestjs/testing';
import { ChartGateway } from './chart.gateway.js';
import { ChartService } from './chart.service.js';

describe('ChartGateway', () => {
  let gateway: ChartGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChartGateway, ChartService],
    }).compile();

    gateway = module.get<ChartGateway>(ChartGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

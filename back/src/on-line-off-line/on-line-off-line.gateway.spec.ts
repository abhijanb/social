import { Test, TestingModule } from '@nestjs/testing';
import { OnLineOffLineGateway } from './on-line-off-line.gateway.js';
import { OnLineOffLineService } from './on-line-off-line.service.js';

describe('OnLineOffLineGateway', () => {
  let gateway: OnLineOffLineGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnLineOffLineGateway, OnLineOffLineService],
    }).compile();

    gateway = module.get<OnLineOffLineGateway>(OnLineOffLineGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});

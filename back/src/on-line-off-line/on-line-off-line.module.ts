import { Module } from '@nestjs/common';
import { OnLineOffLineService } from './on-line-off-line.service.js';
import { OnLineOffLineGateway } from './on-line-off-line.gateway.js';

@Module({
  providers: [OnLineOffLineGateway, OnLineOffLineService],
})
export class OnLineOffLineModule {}

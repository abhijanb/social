import { Module } from '@nestjs/common';
import { ChartService } from './chart.service.js';
import { ChartGateway } from './chart.gateway.js';

@Module({
  providers: [ChartGateway, ChartService],
})
export class ChartModule {}

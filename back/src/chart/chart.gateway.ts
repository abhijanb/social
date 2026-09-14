import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { ChartService } from './chart.service.js';
import { CreateChartDto } from './dto/create-chart.dto.js';
import { UpdateChartDto } from './dto/update-chart.dto.js';

@WebSocketGateway()
export class ChartGateway {
  constructor(private readonly chartService: ChartService) {}

  @SubscribeMessage('createChart')
  create(@MessageBody() createChartDto: CreateChartDto) {
    return this.chartService.create(createChartDto);
  }

  @SubscribeMessage('findAllChart')
  findAll() {
    return this.chartService.findAll();
  }

  @SubscribeMessage('findOneChart')
  findOne(@MessageBody() id: number) {
    return this.chartService.findOne(id);
  }

  @SubscribeMessage('updateChart')
  update(@MessageBody() updateChartDto: UpdateChartDto) {
    return this.chartService.update(updateChartDto.id, updateChartDto);
  }

  @SubscribeMessage('removeChart')
  remove(@MessageBody() id: number) {
    return this.chartService.remove(id);
  }
}

import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { OnLineOffLineService } from './on-line-off-line.service.js';
import { CreateOnLineOffLineDto } from './dto/create-on-line-off-line.dto.js';
import { UpdateOnLineOffLineDto } from './dto/update-on-line-off-line.dto.js';

@WebSocketGateway()
export class OnLineOffLineGateway {
  constructor(private readonly onLineOffLineService: OnLineOffLineService) {}

  @SubscribeMessage('createOnLineOffLine')
  create(@MessageBody() createOnLineOffLineDto: CreateOnLineOffLineDto) {
    return this.onLineOffLineService.create(createOnLineOffLineDto);
  }

  @SubscribeMessage('findAllOnLineOffLine')
  findAll() {
    return this.onLineOffLineService.findAll();
  }

  @SubscribeMessage('findOneOnLineOffLine')
  findOne(@MessageBody() id: number) {
    return this.onLineOffLineService.findOne(id);
  }

  @SubscribeMessage('updateOnLineOffLine')
  update(@MessageBody() updateOnLineOffLineDto: UpdateOnLineOffLineDto) {
    return this.onLineOffLineService.update(updateOnLineOffLineDto.id, updateOnLineOffLineDto);
  }

  @SubscribeMessage('removeOnLineOffLine')
  remove(@MessageBody() id: number) {
    return this.onLineOffLineService.remove(id);
  }
}

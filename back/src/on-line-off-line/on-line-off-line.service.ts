import { Injectable } from '@nestjs/common';
import { CreateOnLineOffLineDto } from './dto/create-on-line-off-line.dto.js';
import { UpdateOnLineOffLineDto } from './dto/update-on-line-off-line.dto.js';

@Injectable()
export class OnLineOffLineService {
  create(createOnLineOffLineDto: CreateOnLineOffLineDto) {
    return 'This action adds a new onLineOffLine';
  }

  findAll() {
    return `This action returns all onLineOffLine`;
  }

  findOne(id: number) {
    return `This action returns a #${id} onLineOffLine`;
  }

  update(id: number, updateOnLineOffLineDto: UpdateOnLineOffLineDto) {
    return `This action updates a #${id} onLineOffLine`;
  }

  remove(id: number) {
    return `This action removes a #${id} onLineOffLine`;
  }
}

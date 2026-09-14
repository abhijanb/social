import { PartialType } from '@nestjs/mapped-types';
import { CreateOnLineOffLineDto } from './create-on-line-off-line.dto.js';

export class UpdateOnLineOffLineDto extends PartialType(CreateOnLineOffLineDto) {
  id: number;
}

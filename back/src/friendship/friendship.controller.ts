import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { FriendshipService } from './friendship.service'
import { createFriendshipSchema, type CreateFriendshipDto } from './dto/create-friendship.dto'
import { updateFriendshipSchema, type UpdateFriendshipDto } from './dto/update-friendship.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createFriendshipSchema)) dto: CreateFriendshipDto) {
    return this.friendshipService.create(dto)
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.friendshipService.findFriends(userId)
    }
    return this.friendshipService.findAll()
  }

  @Get('pending')
  findPending(@Query('userId') userId: string) {
    return this.friendshipService.findPending(userId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.friendshipService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateFriendshipSchema)) dto: UpdateFriendshipDto) {
    return this.friendshipService.update(id, dto)
  }

  @Patch(':id/accept')
  accept(@Param('id') id: string, @Body('userId') userId: string) {
    return this.friendshipService.accept(id, userId)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.friendshipService.remove(id)
  }
}

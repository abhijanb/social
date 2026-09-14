import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto'
import { updateUserSchema, type UpdateUserDto } from './dto/update-user.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async register(@Body(new ZodValidationPipe(createUserSchema)) createUserDto: CreateUserDto) {
    return this.userService.register(createUserDto)
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.userService.findAll(search?.trim() || undefined)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserSchema)) updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}

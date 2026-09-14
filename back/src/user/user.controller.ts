import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, Res, UnauthorizedException } from '@nestjs/common'
import type { Request, Response } from 'express'
import { UserService } from './user.service'
import { createUserSchema, type CreateUserDto } from './dto/create-user.dto'
import { updateUserSchema, type UpdateUserDto } from './dto/update-user.dto'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { verifyToken } from '../lib/jwt'

function getCurrentUser(req: Request): { id: string; username: string } | null {
  const token = req.cookies?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.id || !payload?.username) return null
  return { id: payload.id, username: payload.username }
}

function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async register(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.userService.register(dto)
    setAuthCookie(res, token)
    return user
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.userService.login(dto)
    setAuthCookie(res, token)
    return user
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', { path: '/' })
    return { message: 'Logged out' }
  }

  @Get()
  findAll(@Req() req: Request, @Query('search') search?: string) {
    const trimmed = search?.trim()
    const current = getCurrentUser(req)
    // Strict for search: must be authenticated to get self-excluded results
    if (trimmed && !current) throw new UnauthorizedException('Not authenticated')
    return this.userService.findAll(trimmed, current?.id, current?.username)
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const current = getCurrentUser(req)
    if (!current) throw new UnauthorizedException('Not authenticated')
    const user = await this.userService.findOne(current.id)
    if (!user) throw new UnauthorizedException('User not found')
    return user
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto) {
    return this.userService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id)
  }
}

import { Controller, Get, Post, Body, Query, Req, UnauthorizedException, BadRequestException } from '@nestjs/common'
import type { Request } from 'express'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { verifyToken } from '../lib/jwt.js'
import { PostService } from './post.service.js'
import { createPostSchema, type CreatePostDto } from './dto/create-post.dto.js'

function getCurrentUserId(req: Request): string | null {
  const token = (req as unknown as { cookies?: Record<string, string> }).cookies?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyToken(token)?.id ?? null
}

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  async create(@Req() req: Request, @Body(new ZodValidationPipe(createPostSchema)) dto: CreatePostDto) {
    const meId = getCurrentUserId(req)
    if (!meId) throw new UnauthorizedException('Not authenticated')
    return this.postService.create(meId, dto.text)
  }

  @Get('feed')
  async getFeed(@Req() req: Request, @Query('page') page?: string) {
    const meId = getCurrentUserId(req)
    if (!meId) throw new UnauthorizedException('Not authenticated')
    return this.postService.getFeed(meId, page ? Number(page) : 1)
  }

  @Get()
  async getByAuthor(@Req() req: Request, @Query('authorId') authorId?: string, @Query('page') page?: string) {
    const meId = getCurrentUserId(req)
    if (!meId) throw new UnauthorizedException('Not authenticated')
    if (!authorId?.trim()) throw new BadRequestException('authorId required')
    return this.postService.getByAuthor(meId, authorId.trim(), page ? Number(page) : 1)
  }
}

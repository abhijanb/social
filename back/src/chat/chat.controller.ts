import { Controller, Get, Post, Body, Query, Req, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js'
import { verifyToken } from '../lib/jwt.js'
import { ChatService } from './chat.service.js'
import { sendMessageSchema, type SendMessageDto } from './dto/send-message.dto.js'

function getCurrentUserId(req: Request): string | null {
  const token = (req as unknown as { cookies?: Record<string, string> }).cookies?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyToken(token)?.id ?? null
}

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('history')
  async getHistory(@Req() req: Request, @Query('friendId') friendId?: string, @Query('limit') limit?: string) {
    const meId = getCurrentUserId(req)
    if (!meId) throw new UnauthorizedException('Not authenticated')
    if (!friendId?.trim()) throw new UnauthorizedException('friendId required')
    const n = limit ? Math.min(100, Math.max(1, Number(limit) || 50)) : 50
    return this.chatService.getHistory(meId, friendId.trim(), n)
  }

  @Post('send')
  async send(@Req() req: Request, @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto) {
    const meId = getCurrentUserId(req)
    if (!meId) throw new UnauthorizedException('Not authenticated')
    return this.chatService.send(meId, dto.receiverId, dto.text)
  }
}

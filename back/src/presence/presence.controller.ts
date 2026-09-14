import { Controller, Get, Query, Req, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { verifyToken } from '../lib/jwt.js'
import { PresenceService } from './presence.service.js'

function getCurrentUserId(req: Request): string | null {
  const token = (req as unknown as { cookies?: Record<string, string> }).cookies?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return verifyToken(token)?.id ?? null
}

@Controller('presence')
export class PresenceController {
  constructor(private readonly presence: PresenceService) {}

  @Get()
  getPresence(@Query('ids') ids?: string, @Req() req?: Request) {
    if (!ids) return []
    const currentId = req ? getCurrentUserId(req as Request) : null
    if (!currentId) throw new UnauthorizedException('Not authenticated')
    const list = ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50)
    return this.presence.getPresenceForIds(list)
  }
}

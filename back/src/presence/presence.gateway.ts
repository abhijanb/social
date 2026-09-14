import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets'
import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import type { Socket, Server } from 'socket.io'
import { verifyToken } from '../lib/jwt.js'
import { PresenceService } from './presence.service.js'

function getTokenFromSocket(socket: Socket): string | null {
  const authToken = (socket.handshake.auth as Record<string, unknown>)?.token
  if (typeof authToken === 'string' && authToken) return authToken
  const headerToken = socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (headerToken) return headerToken
  const cookie = socket.handshake.headers.cookie
  if (cookie) {
    for (const part of cookie.split(';')) {
      const [k, ...rest] = part.trim().split('=')
      if (k === 'token') return decodeURIComponent(rest.join('='))
    }
  }
  return null
}

@WebSocketGateway({
  namespace: '/presence',
  cors: { origin: true, credentials: true },
})
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(private readonly presence: PresenceService) {}

  async handleConnection(client: Socket) {
    const token = getTokenFromSocket(client)
    if (!token) {
      client.disconnect()
      return
    }
    const payload = verifyToken(token)
    if (!payload?.id) {
      client.disconnect()
      return
    }
    const userId = payload.id
    ;(client.data as Record<string, unknown>).userId = userId
    this.presence.setOnline(userId, client.id)
    client.join(`user:${userId}`)
    this.server.emit('presence:update', { userId, online: true, lastSeenAt: null })
  }

  async handleDisconnect(client: Socket) {
    const result = this.presence.setOfflineBySocket(client.id)
    if (result?.wentOffline) {
      const info = this.presence.getPresence(result.userId)
      this.server.emit('presence:update', info)
    }
  }

  @SubscribeMessage('presence:heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = (client.data as Record<string, unknown>).userId as string | undefined
    if (userId) this.presence.touch(userId)
    return { ok: true }
  }

  @SubscribeMessage('presence:ping')
  handlePing() {
    return { ok: true }
  }
}

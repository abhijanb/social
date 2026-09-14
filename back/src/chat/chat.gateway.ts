import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import type { Socket, Server } from 'socket.io'
import { verifyToken } from '../lib/jwt.js'
import { ChatService } from './chat.service.js'

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
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(private readonly chatService: ChatService) {}

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
    ;(client.data as Record<string, unknown>).userId = payload.id
    client.join(`user:${payload.id}`)
  }

  async handleDisconnect(_client: Socket) {}

  @SubscribeMessage('chat:send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { to: string; text: string },
  ) {
    const userId = (client.data as Record<string, unknown>).userId as string | undefined
    if (!userId) return { ok: false, error: 'Not authenticated' }
    const to = (data?.to ?? '').trim()
    const text = (data?.text ?? '').trim()
    if (!to || !text) return { ok: false, error: 'Invalid payload' }
    try {
      const message = await this.chatService.send(userId, to, text)
      const payload = { message }
      this.server.to(`user:${to}`).emit('chat:receive', payload)
      this.server.to(`user:${userId}`).emit('chat:receive', payload)
      return { ok: true, message }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send'
      return { ok: false, error: msg }
    }
  }
}

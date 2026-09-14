import { ForbiddenException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service.js'

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureFriends(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new BadRequestException('Cannot message yourself')
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: senderId, addresseeId: receiverId },
          { requesterId: receiverId, addresseeId: senderId },
        ],
      },
    })
    if (!friendship) throw new ForbiddenException('Not friends')
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) throw new NotFoundException('Receiver not found')
  }

  async send(senderId: string, receiverId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) throw new BadRequestException('Message cannot be empty')
    if (trimmed.length > 1000) throw new BadRequestException('Message too long')
    await this.ensureFriends(senderId, receiverId)
    const message = await this.prisma.message.create({
      data: { senderId, receiverId, text: trimmed },
    })
    return message
  }

  async getHistory(meId: string, friendId: string, limit = 50) {
    await this.ensureFriends(meId, friendId)
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: meId, receiverId: friendId },
          { senderId: friendId, receiverId: meId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
    return messages
  }
}

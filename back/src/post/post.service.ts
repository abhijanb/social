import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service.js'

const authorSelect = { id: true, username: true } as const

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  private async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    })
    return friendships.map((f) => (f.requesterId === userId ? f.addresseeId : f.requesterId))
  }

  private async ensureCanView(viewerId: string, authorId: string) {
    if (viewerId === authorId) return
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: viewerId, addresseeId: authorId },
          { requesterId: authorId, addresseeId: viewerId },
        ],
      },
    })
    if (!friendship) throw new ForbiddenException('Not friends')
  }

  async create(authorId: string, text: string) {
    const trimmed = text.trim()
    if (!trimmed) throw new BadRequestException('Post cannot be empty')
    if (trimmed.length > 2200) throw new BadRequestException('Post too long (max 2200 characters)')
    return this.prisma.post.create({
      data: { authorId, text: trimmed },
      include: { author: { select: authorSelect } },
    })
  }

  async getFeed(meId: string, limit = 20, cursor?: string) {
    const n = Math.min(50, Math.max(1, limit))
    const friendIds = await this.getFriendIds(meId)
    return this.prisma.post.findMany({
      where: { authorId: { in: [meId, ...friendIds] } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: n,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { author: { select: authorSelect } },
    })
  }

  async getByAuthor(meId: string, authorId: string, limit = 20, cursor?: string) {
    await this.ensureCanView(meId, authorId)
    const n = Math.min(50, Math.max(1, limit))
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: n,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { author: { select: authorSelect } },
    })
  }
}

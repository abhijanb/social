import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service.js'

const authorSelect = { id: true, username: true } as const

/** Server-owned page size – clients cannot dictate it via query params. */
export const FEED_PAGE_SIZE = 20

export type PostWithAuthor = {
  id: string
  authorId: string
  text: string
  createdAt: Date
  author: { id: string; username: string }
}

export type FeedPage = {
  posts: PostWithAuthor[]
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null
}

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

  async getFeed(meId: string, page = 1): Promise<FeedPage> {
    const friendIds = await this.getFriendIds(meId)
    return this.findPage([meId, ...friendIds], page)
  }

  async getByAuthor(meId: string, authorId: string, page = 1): Promise<FeedPage> {
    await this.ensureCanView(meId, authorId)
    return this.findPage([authorId], page)
  }

  private async findPage(authorIds: string[], page = 1): Promise<FeedPage> {
    const p = Math.max(1, Math.floor(page) || 1)
    const rows = await this.prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (p - 1) * FEED_PAGE_SIZE,
      take: FEED_PAGE_SIZE + 1,
      include: { author: { select: authorSelect } },
    })
    const hasMore = rows.length > FEED_PAGE_SIZE
    const posts = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows
    return { posts, nextPage: hasMore ? p + 1 : null }
  }
}

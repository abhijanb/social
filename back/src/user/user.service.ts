import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'
import { signToken } from '../lib/jwt'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestUsernames(base: string, count = 3): Promise<string[]> {
    const sanitized = base.trim().slice(0, 20)
    if (!sanitized) return []
    const candidates: string[] = []
    for (let i = 1; candidates.length < count * 10 && i <= 1000; i++) {
      const s = String(i)
      const name = `${sanitized.slice(0, 20 - s.length)}${s}`
      if (name.length >= 3) candidates.push(name)
    }
    const existing = await this.prisma.user.findMany({
      where: { username: { in: candidates } },
      select: { username: true },
    })
    const taken = new Set(existing.map((u) => u.username))
    return candidates.filter((c) => !taken.has(c)).slice(0, count)
  }

  async register(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { username: dto.username } })
    if (exists) {
      throw new ConflictException({
        message: `Username "${dto.username}" is already taken`,
        suggestions: await this.suggestUsernames(dto.username),
      })
    }
    const user = await this.prisma.user.create({
      data: { username: dto.username, password: await bcrypt.hash(dto.password, 10) },
    })
    const { password: _, ...safeUser } = user
    return { user: safeUser, token: signToken({ id: user.id, username: user.username }) }
  }

  async login(dto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { username: dto.username } })
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials')
    }
    const { password: _, ...safeUser } = user
    return { user: safeUser, token: signToken({ id: user.id, username: user.username }) }
  }

  async findAll(search?: string, currentUserId?: string, currentUsername?: string) {
    // currentUserId + currentUsername come from verified JWT
    let friendIds: string[] = []
    if (currentUserId) {
      const friendships = await this.prisma.friendship.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
        select: { requesterId: true, addresseeId: true },
      })
      friendIds = friendships.map((f) => (f.requesterId === currentUserId ? f.addresseeId : f.requesterId))
    }

    const excludeIds = [...(currentUserId ? [currentUserId] : []), ...friendIds]

    // Build where: search contains + exclude self by id + exclude self by username (case-insensitive) + exclude friends
    const and: Record<string, unknown>[] = []
    if (search) and.push({ username: { contains: search, mode: 'insensitive' as const } })
    if (excludeIds.length) and.push({ id: { notIn: excludeIds } })
    if (currentUsername?.trim()) {
      and.push({ NOT: { username: { equals: currentUsername.trim(), mode: 'insensitive' as const } } })
    }

    const where = and.length ? ({ AND: and } as never) : undefined

    const users = await this.prisma.user.findMany({
      where,
      take: 10,
      orderBy: { createdAt: 'desc' },
    })
    return users.map(({ password: _, ...u }) => u)
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) return null
    const { password: _, ...rest } = user
    return rest
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: Record<string, unknown> = { ...dto }
    if (typeof data.password === 'string') data.password = await bcrypt.hash(data.password as string, 10)
    const user = await this.prisma.user.update({ where: { id }, data })
    const { password: _, ...rest } = user
    return rest
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } })
  }
}

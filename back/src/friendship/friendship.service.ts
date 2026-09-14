import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { CreateFriendshipDto } from './dto/create-friendship.dto'
import type { UpdateFriendshipDto } from './dto/update-friendship.dto'

@Injectable()
export class FriendshipService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFriendshipDto) {
    const { requesterId, addresseeId } = dto

    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot add yourself as friend')
    }

    const [requester, addressee] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: requesterId } }),
      this.prisma.user.findUnique({ where: { id: addresseeId } }),
    ])

    if (!requester || !addressee) {
      throw new NotFoundException('User not found')
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new ConflictException('Users are already friends')
      }
      if (existing.status === 'BLOCKED') {
        throw new ConflictException('Friendship is blocked')
      }
      // PENDING in either direction
      throw new ConflictException('Friend request already exists')
    }

    return this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'PENDING',
      },
    })
  }

  async findAll() {
    return this.prisma.friendship.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async findOne(id: string) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } })
    if (!friendship) throw new NotFoundException('Friendship not found')
    return friendship
  }

  async findFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true, createdAt: true } },
        addressee: { select: { id: true, username: true, createdAt: true } },
      },
    })

    // Map to friend user object
    return friendships.map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester
      return { friendshipId: f.id, friend, status: f.status, createdAt: f.createdAt }
    })
  }

  async findPending(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        status: 'PENDING',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, username: true } },
        addressee: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async update(id: string, dto: UpdateFriendshipDto) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } })
    if (!friendship) throw new NotFoundException('Friendship not found')

    return this.prisma.friendship.update({
      where: { id },
      data: { status: dto.status },
    })
  }

  async accept(id: string, userId: string) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } })
    if (!friendship) throw new NotFoundException('Friendship not found')
    if (friendship.addresseeId !== userId) {
      throw new BadRequestException('Only addressee can accept request')
    }
    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Friendship is not pending')
    }
    return this.prisma.friendship.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    })
  }

  async remove(id: string) {
    const friendship = await this.prisma.friendship.findUnique({ where: { id } })
    if (!friendship) throw new NotFoundException('Friendship not found')
    return this.prisma.friendship.delete({ where: { id } })
  }
}

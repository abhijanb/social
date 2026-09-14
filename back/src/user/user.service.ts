import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async suggestUsernames(baseUsername: string, count = 3): Promise<string[]> {
    const MAX_USERNAME_LENGTH = 20
    const sanitized = baseUsername.trim()
    if (!sanitized) return []

    const candidates: string[] = []
    let suffix = 1

    // Generate incremental candidates (e.g., alex1, alex2, alex3)
    // Ensure each candidate respects MAX_USERNAME_LENGTH by truncating base if needed
    // Generate up to count*10 (30) candidates so deterministic suggestions remain available
    // even when first few suffixes are all taken (e.g., alex1..alex9 taken -> alex10..)
    while (candidates.length < count * 10 && suffix <= 1000) {
      const suffixStr = String(suffix)
      const maxBaseLen = MAX_USERNAME_LENGTH - suffixStr.length
      const truncatedBase = sanitized.slice(0, maxBaseLen)
      const candidate = `${truncatedBase}${suffixStr}`
      if (candidate.length >= 3 && !candidates.includes(candidate)) {
        candidates.push(candidate)
      }
      suffix++
    }

    const existing = await this.prisma.user.findMany({
      where: { username: { in: candidates } },
      select: { username: true },
    })
    const existingSet = new Set(existing.map((u) => u.username))
    let suggestions = candidates.filter((c) => !existingSet.has(c)).slice(0, count)

    // Fallback: generate random 4-digit suffixes if incremental candidates are all taken
    let attempts = 0
    while (suggestions.length < count && attempts < 20) {
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const suffixStr = String(randomNum)
      const maxBaseLen = MAX_USERNAME_LENGTH - suffixStr.length
      const truncatedBase = sanitized.slice(0, maxBaseLen)
      const candidate = `${truncatedBase}${suffixStr}`
      if (
        candidate.length >= 3 &&
        !candidates.includes(candidate) &&
        !suggestions.includes(candidate) &&
        !existingSet.has(candidate)
      ) {
        const exists = await this.prisma.user.findUnique({ where: { username: candidate } })
        if (!exists) {
          suggestions.push(candidate)
          existingSet.add(candidate)
        }
      }
      attempts++
    }

    return suggestions.slice(0, count)
  }

  async register(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto
    const userExists = await this.prisma.user.findUnique({
      where: { username },
    })

    if (userExists) {
      const suggestions = await this.suggestUsernames(username, 3)
      throw new ConflictException({
        message: `Username "${username}" is already taken`,
        suggestions,
      })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashed,
      },
    })
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: Record<string, unknown> = { ...updateUserDto }
    if (typeof data.password === 'string') {
      data.password = await bcrypt.hash(data.password as string, 10)
    }
    const user = await this.prisma.user.update({ where: { id }, data })
    const { password: _, ...rest } = user
    return rest
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } })
  }
}

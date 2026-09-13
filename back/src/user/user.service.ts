import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto
    const userExists = await this.prisma.user.findUnique({
      where: { username },
    })

    if (userExists) {
      throw new ConflictException('User already exists')
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

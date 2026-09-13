import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import type { UpdateUserDto } from './dto/update-user.dto'

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
    const user = await this.prisma.user.create({
      data: {
        username,
        password,
      },
    })
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  findAll() {
    return this.prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    })
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({ where: { id }, data: updateUserDto })
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } })
  }
}

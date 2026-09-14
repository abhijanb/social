import { Module } from '@nestjs/common'
import { ChatService } from './chat.service.js'
import { ChatController } from './chat.controller.js'
import { ChatGateway } from './chat.gateway.js'
import { PrismaService } from '../prisma.service.js'

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PrismaService],
})
export class ChatModule {}

import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";
import { UserModule } from "./user/user.module";
import { FriendshipModule } from "./friendship/friendship.module";
import { ChartModule } from './chart/chart.module.js';
import { OnLineOffLineModule } from './on-line-off-line/on-line-off-line.module.js';

@Module({
  imports: [UserModule, FriendshipModule, ChartModule, OnLineOffLineModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}

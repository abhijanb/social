import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";
import { UserModule } from "./user/user.module";
import { FriendshipModule } from "./friendship/friendship.module";
import { ChartModule } from './chart/chart.module.js';

@Module({
  imports: [UserModule, FriendshipModule, ChartModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}

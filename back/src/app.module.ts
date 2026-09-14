import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";
import { UserModule } from "./user/user.module";
import { FriendshipModule } from "./friendship/friendship.module";

@Module({
  imports: [UserModule, FriendshipModule],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}

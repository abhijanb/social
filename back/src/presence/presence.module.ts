import { Module } from '@nestjs/common'
import { PresenceGateway } from './presence.gateway.js'
import { PresenceService } from './presence.service.js'
import { PresenceController } from './presence.controller.js'

@Module({
  controllers: [PresenceController],
  providers: [PresenceGateway, PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}

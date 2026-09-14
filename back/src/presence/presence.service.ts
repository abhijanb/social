import { Injectable } from '@nestjs/common'

export type PresenceInfo = { userId: string; online: boolean; lastSeenAt: string | null }

@Injectable()
export class PresenceService {
  private socketsByUser = new Map<string, Set<string>>()
  private userBySocket = new Map<string, string>()
  private lastSeenByUser = new Map<string, Date>()

  setOnline(userId: string, socketId: string) {
    if (!this.socketsByUser.has(userId)) this.socketsByUser.set(userId, new Set())
    this.socketsByUser.get(userId)!.add(socketId)
    this.userBySocket.set(socketId, userId)
    this.lastSeenByUser.delete(userId)
  }

  setOfflineBySocket(socketId: string): { userId: string; wentOffline: boolean } | null {
    const userId = this.userBySocket.get(socketId)
    if (!userId) return null
    this.userBySocket.delete(socketId)
    const set = this.socketsByUser.get(userId)
    if (set) {
      set.delete(socketId)
      if (set.size === 0) {
        this.socketsByUser.delete(userId)
        this.lastSeenByUser.set(userId, new Date())
        return { userId, wentOffline: true }
      }
    }
    return { userId, wentOffline: false }
  }

  touch(userId: string) {
    if (this.isOnline(userId)) this.lastSeenByUser.delete(userId)
  }

  isOnline(userId: string): boolean {
    return this.socketsByUser.has(userId)
  }

  getPresence(userId: string): PresenceInfo {
    return {
      userId,
      online: this.isOnline(userId),
      lastSeenAt: this.lastSeenByUser.get(userId)?.toISOString() ?? null,
    }
  }

  getPresenceForIds(ids: string[]): PresenceInfo[] {
    return ids.map((id) => this.getPresence(id))
  }

  getAllOnlineIds(): string[] {
    return [...this.socketsByUser.keys()]
  }
}

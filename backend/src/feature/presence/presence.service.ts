// Port of back/src/presence/presence.service.ts — in-memory online
// tracking. Module-level Maps act as the singleton (one process, one
// state); multi-tab works because each tab holds its own socket id.
export type PresenceInfo = {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
};

const socketsByUser = new Map<string, Set<string>>();
const userBySocket = new Map<string, string>();
const lastSeenByUser = new Map<string, Date>();

export function setOnline(userId: string, socketId: string): void {
  if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
  socketsByUser.get(userId)!.add(socketId);
  userBySocket.set(socketId, userId);
  lastSeenByUser.delete(userId);
}

export function setOfflineBySocket(
  socketId: string,
): { userId: string; wentOffline: boolean } | null {
  const userId = userBySocket.get(socketId);
  if (!userId) return null;
  userBySocket.delete(socketId);
  const set = socketsByUser.get(userId);
  if (set) {
    set.delete(socketId);
    if (set.size === 0) {
      socketsByUser.delete(userId);
      lastSeenByUser.set(userId, new Date());
      return { userId, wentOffline: true };
    }
  }
  return { userId, wentOffline: false };
}

export function touchPresence(userId: string): void {
  if (isOnline(userId)) lastSeenByUser.delete(userId);
}

export function isOnline(userId: string): boolean {
  return socketsByUser.has(userId);
}

export function getPresence(userId: string): PresenceInfo {
  return {
    userId,
    online: isOnline(userId),
    lastSeenAt: lastSeenByUser.get(userId)?.toISOString() ?? null,
  };
}

export function getPresenceForIds(ids: string[]): PresenceInfo[] {
  return ids.map((id) => getPresence(id));
}

export function getAllOnlineIds(): string[] {
  return [...socketsByUser.keys()];
}

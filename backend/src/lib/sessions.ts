import { prisma } from "./prisma.js";

// Shared session-liveness check for HTTP middleware and sockets.
// A session is live when its row exists, belongs to the user, and is
// neither revoked nor expired. Returns the row's lastSeenAt for throttling.
export async function getLiveSession(
  jti: string,
  userId: string,
): Promise<{ lastSeenAt: Date } | null> {
  const session = await prisma.session.findUnique({
    where: { id: jti },
    select: {
      userId: true,
      revokedAt: true,
      expiresAt: true,
      lastSeenAt: true,
    },
  });
  if (!session) return null;
  if (session.userId !== userId) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return { lastSeenAt: session.lastSeenAt };
}

// Throttle lastSeenAt writes — pollers hit authed routes every 1.5s,
// so only touch the row when it is visibly stale.
export const LAST_SEEN_TTL_MS = 5 * 60 * 1000;

export async function touchSessionIfStale(
  jti: string,
  lastSeenAt: Date,
): Promise<void> {
  if (Date.now() - lastSeenAt.getTime() < LAST_SEEN_TTL_MS) return;
  await prisma.session.update({
    where: { id: jti },
    data: { lastSeenAt: new Date() },
  });
}

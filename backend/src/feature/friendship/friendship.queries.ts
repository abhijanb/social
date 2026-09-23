import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";

const log = logger.child({ service: "friendship" });

// Port of FriendshipService.findAll — recent 50 (admin-ish fallback when
// no userId is given, kept for Nest parity).
export async function findAllFriendships() {
  log.debug("list all friendships");
  return prisma.friendship.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Port of FriendshipService.findOne — throws 404 when missing.
// Participant-only: non-participants get 404 (same as missing) so row
// existence isn't leaked. actorId comes from the authenticated user.
export async function findFriendshipById(id: string, actorId: string) {
  log.debug({ id }, "find friendship by id");
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  if (
    friendship.requesterId !== actorId &&
    friendship.addresseeId !== actorId
  ) {
    throw new AppError("Friendship not found", 404);
  }
  return friendship;
}

// Port of FriendshipService.findFriends — ACCEPTED rows mapped to the
// friend on the other side: { friendshipId, friend, status, createdAt }.
export async function findFriends(userId: string) {
  log.debug({ userId }, "find friends");
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true, createdAt: true } },
      addressee: { select: { id: true, username: true, avatarUrl: true, createdAt: true } },
    },
  });

  return friendships.map((f) => {
    const friend = f.requesterId === userId ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      friend,
      status: f.status,
      createdAt: f.createdAt,
    };
  });
}

// Port of FriendshipService.findPending — PENDING rows in both directions,
// newest first.
export async function findPending(userId: string) {
  log.debug({ userId }, "find pending");
  return prisma.friendship.findMany({
    where: {
      status: "PENDING",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, username: true, avatarUrl: true } },
      addressee: { select: { id: true, username: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

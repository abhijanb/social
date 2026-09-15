import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import {
  acceptFriendshipSchema,
  createFriendshipSchema,
  updateFriendshipSchema,
} from "./friendship.schema.js";

// Port of FriendshipService.create — PENDING request between two existing
// users. Self-add → 400, unknown user → 404, any existing row in either
// direction → 409 (already friends / blocked / pending).
export async function createFriendship(input: unknown) {
  const { requesterId, addresseeId } = validateOrThrow(
    createFriendshipSchema,
    input,
  );

  if (requesterId === addresseeId) {
    throw new AppError("Cannot add yourself as friend", 400);
  }

  const [requester, addressee] = await Promise.all([
    prisma.user.findUnique({ where: { id: requesterId } }),
    prisma.user.findUnique({ where: { id: addresseeId } }),
  ]);

  if (!requester || !addressee) {
    throw new AppError("User not found", 404);
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw new AppError("Users are already friends", 409);
    }
    if (existing.status === "BLOCKED") {
      throw new AppError("Friendship is blocked", 409);
    }
    // PENDING in either direction
    throw new AppError("Friend request already exists", 409);
  }

  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: "PENDING",
    },
  });
}

// Port of FriendshipService.findAll — recent 50 (admin-ish fallback when
// no userId is given, kept for Nest parity).
export async function findAllFriendships() {
  return prisma.friendship.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// Port of FriendshipService.findOne — throws 404 when missing.
export async function findFriendshipById(id: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  return friendship;
}

// Port of FriendshipService.findFriends — ACCEPTED rows mapped to the
// friend on the other side: { friendshipId, friend, status, createdAt }.
export async function findFriends(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, username: true, createdAt: true } },
      addressee: { select: { id: true, username: true, createdAt: true } },
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
  return prisma.friendship.findMany({
    where: {
      status: "PENDING",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: { select: { id: true, username: true } },
      addressee: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Port of FriendshipService.update — status change, 404 when missing.
export async function updateFriendship(id: string, input: unknown) {
  const dto = validateOrThrow(updateFriendshipSchema, input);
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);

  return prisma.friendship.update({
    where: { id },
    data: { status: dto.status },
  });
}

// Port of FriendshipService.accept — addressee-only, PENDING-only.
export async function acceptFriendship(id: string, input: unknown) {
  const { userId } = validateOrThrow(acceptFriendshipSchema, input);
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  if (friendship.addresseeId !== userId) {
    throw new AppError("Only addressee can accept request", 400);
  }
  if (friendship.status !== "PENDING") {
    throw new AppError("Friendship is not pending", 400);
  }
  return prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });
}

// Port of FriendshipService.remove — 404 when missing.
export async function removeFriendship(id: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  return prisma.friendship.delete({ where: { id } });
}

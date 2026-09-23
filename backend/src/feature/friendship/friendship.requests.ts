import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import {
  sendFriendAcceptedEmail,
  sendFriendRequestEmail,
} from "../notification/mailNotification.js";
import {
  notifyFriendAccepted,
  notifyFriendRequest,
} from "../notification/notification.request.js";
import {
  createFriendshipSchema,
  updateFriendshipSchema,
} from "./friendship.schema.js";

const log = logger.child({ service: "friendship" });

async function assertUsersExist(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const [requester, addressee] = await Promise.all([
    prisma.user.findUnique({ where: { id: requesterId } }),
    prisma.user.findUnique({ where: { id: addresseeId } }),
  ]);
  if (!requester || !addressee) {
    throw new AppError("User not found", 404);
  }
}

async function assertNoDuplicateFriendship(
  requesterId: string,
  addresseeId: string,
): Promise<void> {
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });
  if (!existing) return;
  if (existing.status === "ACCEPTED") {
    throw new AppError("Users are already friends", 409);
  }
  if (existing.status === "BLOCKED") {
    throw new AppError("Friendship is blocked", 409);
  }
  // PENDING in either direction
  throw new AppError("Friend request already exists", 409);
}

// Port of FriendshipService.create — PENDING request between two existing
// users. Self-add → 400, unknown user → 404, any existing row in either
// direction → 409 (already friends / blocked / pending).
// requesterId comes from the authenticated user (never trusted from the client).
export async function createFriendship(
  requesterId: string,
  input: unknown,
) {
  const { addresseeId } = validateOrThrow(createFriendshipSchema, input);

  if (requesterId === addresseeId) {
    throw new AppError("Cannot add yourself as friend", 400);
  }
  await assertUsersExist(requesterId, addresseeId);
  await assertNoDuplicateFriendship(requesterId, addresseeId);

  const friendship = await prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: "PENDING",
    },
  });
  await notifyFriendRequest(addresseeId, requesterId);
  sendFriendRequestEmail(addresseeId, requesterId).catch(() => {});
  log.info({ friendshipId: friendship.id, requesterId, addresseeId }, "friend request created");
  return friendship;
}

// Port of FriendshipService.update — status change, 404 when missing.
// Only participants (requester or addressee) may update; ACCEPTED via this
// route is addressee-only so it cannot bypass the accept rule. actorId comes
// from the authenticated user (never trusted from the client).
export async function updateFriendship(
  id: string,
  input: unknown,
  actorId: string,
) {
  const dto = validateOrThrow(updateFriendshipSchema, input);
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  if (
    friendship.requesterId !== actorId &&
    friendship.addresseeId !== actorId
  ) {
    throw new AppError("Only participants can update friendship", 400);
  }
  if (dto.status === "ACCEPTED" && friendship.addresseeId !== actorId) {
    throw new AppError("Only addressee can accept request", 400);
  }
  log.debug({ id, status: dto.status }, "friendship update");
  return prisma.friendship.update({
    where: { id },
    data: { status: dto.status },
  });
}

// Port of FriendshipService.accept — addressee-only, PENDING-only. actorId
// comes from the authenticated user (never trusted from the client body,
// which this endpoint no longer reads).
export async function acceptFriendship(id: string, actorId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  if (friendship.addresseeId !== actorId) {
    throw new AppError("Only addressee can accept request", 400);
  }
  if (friendship.status !== "PENDING") {
    throw new AppError("Friendship is not pending", 400);
  }
  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });
  await notifyFriendAccepted(friendship.requesterId, friendship.addresseeId);
  sendFriendAcceptedEmail(friendship.requesterId, friendship.addresseeId).catch(() => {});
  log.info({ friendshipId: id, requesterId: friendship.requesterId, addresseeId: friendship.addresseeId }, "friend accepted");
  return updated;
}

// Port of FriendshipService.remove — 404 when missing, participant-only.
// actorId comes from the authenticated user (never trusted from the client).
export async function removeFriendship(id: string, actorId: string) {
  log.debug({ id }, "friendship delete");
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  if (
    friendship.requesterId !== actorId &&
    friendship.addresseeId !== actorId
  ) {
    throw new AppError("Only participants can delete friendship", 400);
  }
  const deleted = await prisma.friendship.delete({ where: { id } });
  log.info({ friendshipId: id }, "friendship deleted");
  return deleted;
}

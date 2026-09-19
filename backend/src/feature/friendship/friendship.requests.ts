import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import {
  notifyFriendAccepted,
  notifyFriendRequest,
} from "../notification/notification.request.js";
import {
  acceptFriendshipSchema,
  createFriendshipSchema,
  updateFriendshipSchema,
} from "./friendship.schema.js";

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
  return friendship;
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
  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });
  await notifyFriendAccepted(friendship.requesterId, friendship.addresseeId);
  return updated;
}

// Port of FriendshipService.remove — 404 when missing.
export async function removeFriendship(id: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found", 404);
  return prisma.friendship.delete({ where: { id } });
}

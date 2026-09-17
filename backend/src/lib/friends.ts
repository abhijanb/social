import { AppError } from "./errorHandler.js";
import { prisma } from "./prisma.js";

// Shared friends-only helpers – single source of truth (were copy-pasted
// across post/story/livestream/chat services and the livestream socket).

/** ACCEPTED friend ids for a user, either direction. */
export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });
  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}

/**
 * Friends-only guard: self always passes, anyone else needs an ACCEPTED
 * friendship (either direction). Message is parameterized so callers keep
 * their exact API contract ("Not friends" vs "Not friends with the host").
 */
export async function ensureCanView(
  viewerId: string,
  otherId: string,
  notFriendsMessage = "Not friends",
): Promise<void> {
  if (viewerId === otherId) return;
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: viewerId },
      ],
    },
  });
  if (!friendship) throw new AppError(notFriendsMessage, 403);
}

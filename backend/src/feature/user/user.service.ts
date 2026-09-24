import * as bcrypt from "bcrypt";
import { AppError, uniqueConflictTarget } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { getFriendIds } from "../../lib/friends.js";
import { deleteUploadUrls } from "../../lib/uploads.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { stripPassword } from "../../lib/stripPassword.js";
import { validateOrThrow } from "../../lib/validate.js";
import { updateUserSchema } from "./user.schema.js";

const log = logger.child({ service: "user" });

// Port of UserService.findAll — live user search with JWT-based exclusion:
// skips self (by id + case-insensitive username) and ACCEPTED friends.
// PENDING requests are NOT excluded so the UI can show Accept/Pending.
// Search matches case-insensitively and hides private (isPublic=false)
// users; without a search term it lists recent users (capped at 10).
export async function findAll(
  search: string,
  currentUserId?: string,
  opts?: { isAborted?: () => boolean },
) {
  log.debug({ search, currentUserId }, "user search");
  let friendIds: string[] = [];
  if (currentUserId) {
    friendIds = await getFriendIds(currentUserId);
  }

  // Frontend cancelled (next keystroke aborted this request, tab closed).
  // Skip the 2nd DB trip — nobody listens for the response anymore.
  if (opts?.isAborted?.()) {
    log.debug({ search }, "user search aborted, skipping findMany");
    return null;
  }

  const excludeIds = [...(currentUserId ? [currentUserId] : []), ...friendIds];

  const and: Record<string, unknown>[] = [];
  if (search) {
    and.push({ username: { contains: search, mode: "insensitive" as const } });
  }
  // Private (isPublic=false) users are never listed — with or without a
  // search term. Previously the filter only applied when searching, so an
  // anonymous GET /user leaked the 10 newest private profiles.
  and.push({ isPublic: true });
  if (excludeIds.length) and.push({ id: { notIn: excludeIds } });

  const where = and.length ? ({ AND: and } as never) : undefined;

  const users = await prisma.user.findMany({
    where,
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return users.map(stripPassword);
}

// Public shell of a user row for strangers viewing a private profile:
// username/avatar stay visible so friend-request flows keep working, but
// email/bio stay hidden. Self, public profiles, and friends get the full
// stripped row instead.
function publicMiniUser(target: {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
}) {
  return {
    id: target.id,
    username: target.username,
    displayName: target.displayName,
    avatarUrl: target.avatarUrl,
    isPublic: target.isPublic,
  };
}

// Port of UserService.findOne — null when missing so the route can 404.
// Private profiles return only the public shell to strangers (self,
// public, and friends see the full row).
export async function findUserById(id: string, viewerId?: string) {
  log.debug({ id }, "find user by id");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  if (viewerId && viewerId !== user.id && !user.isPublic) {
    const friendIds = await getFriendIds(viewerId);
    if (!friendIds.includes(user.id)) return publicMiniUser(user);
  }
  return stripPassword(user);
}

// Case-insensitive lookup by username — backing GET /user/by-username/:username.
export async function findUserByUsername(username: string) {
  log.debug({ username }, "find user by username");
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (!user) return null;
  return stripPassword(user);
}

export type ProfileRelation = {
  isSelf: boolean;
  isFriend: boolean;
  pending: boolean;
  canViewPosts: boolean;
};

// Profile payload for /u/:username: user + counts + viewer relation.
// Private (isPublic=false) users hide counts AND email/bio from strangers
// (public shell only); posts grid itself stays guarded by
// GET /post?authorId= (403).
export async function getProfile(viewerId: string, username: string) {
  log.debug({ viewerId, username }, "profile lookup");
  const target = await prisma.user.findFirst({
    where: { username: { equals: username.trim(), mode: "insensitive" } },
  });
  if (!target) throw new AppError("User not found", 404);
  const isSelf = target.id === viewerId;

  let isFriend = false;
  let pending = false;
  if (!isSelf) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: viewerId },
        ],
      },
      select: { status: true },
    });
    isFriend = friendship?.status === "ACCEPTED";
    pending = friendship?.status === "PENDING";
  }

  const canViewPosts = isSelf || target.isPublic || isFriend;
  const [posts, friends, storiesActive] = canViewPosts || isSelf
    ? await Promise.all([
        prisma.post.count({ where: { authorId: target.id } }),
        prisma.friendship.count({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: target.id }, { addresseeId: target.id }],
          },
        }),
        prisma.story.count({
          where: { authorId: target.id, expiresAt: { gt: new Date() }, deletedAt: null },
        }),
      ])
    : [0, 0, 0];

  const relation: ProfileRelation = { isSelf, isFriend, pending, canViewPosts };
  const user = isSelf || canViewPosts ? stripPassword(target) : publicMiniUser(target);
  return { user, stats: { posts, friends, storiesActive }, relation };
}

// Port of UserService.update — validates input, re-hashes a new password,
// 404 when the user does not exist. Avatar changes arrive via opts (never
// via client-settable body fields): { avatarUrl: string } sets,
// { avatarUrl: null } clears. Uploaded file wins over removeAvatar.
export async function updateUser(
  id: string,
  input: unknown,
  opts?: { avatarUrl?: string | null },
) {
  const dto = validateOrThrow(updateUserSchema, input);
  const { removeAvatar: _removeAvatar, ...rest } = dto;
  void _removeAvatar;
  const data: Record<string, unknown> = { ...rest };
  // Empty displayName clears it to null (keeps column nullable).
  if (data.displayName === "") data.displayName = null;
  if (opts && "avatarUrl" in opts) data.avatarUrl = opts.avatarUrl;
  else if (dto.removeAvatar) data.avatarUrl = null;
  if (typeof data.password === "string") {
    data.password = await bcrypt.hash(data.password, 10);
  }
  log.debug({ userId: id, avatarUrl: data.avatarUrl }, "update user");
  try {
    const user = await prisma.user.update({ where: { id }, data });
    return stripPassword(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new AppError("User not found", 404);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = uniqueConflictTarget(error);
      if (target.some((field) => field.includes("username"))) {
        throw new AppError(
          `Username "${String(data.username)}" is already taken`,
          409,
        );
      }
      throw new AppError("That email is already registered", 409);
    }
    throw error;
  }
}

// Port of UserService.remove — 404 when the user does not exist.
// Unlinks a local avatar file so deleted users leave no orphans.
export async function removeUser(id: string) {
  log.debug({ userId: id }, "remove user");
  const existing = await prisma.user.findUnique({
    where: { id },
    select: { avatarUrl: true },
  });
  try {
    await prisma.user.delete({ where: { id } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new AppError("User not found", 404);
    throw error;
  }
  const oldUrl = existing?.avatarUrl;
  if (oldUrl) {
    await deleteUploadUrls([oldUrl]);
  }
}

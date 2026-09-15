import * as bcrypt from "bcrypt";
import { AppError } from "../../lib/errorHandler.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { stripPassword } from "../../lib/stripPassword.js";
import { validateOrThrow } from "../../lib/validate.js";
import { updateUserSchema } from "./user.schema.js";

// Port of UserService.findAll — live user search with JWT-based exclusion:
// skips self (by id + case-insensitive username) and ACCEPTED friends.
// PENDING requests are NOT excluded so the UI can show Accept/Pending.
// Search matches case-insensitively and hides private (isPublic=false)
// users; without a search term it lists recent users (capped at 10).
export async function findAll(
  search: string,
  currentUserId?: string,
  currentUsername?: string,
) {
  let friendIds: string[] = [];
  if (currentUserId) {
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    friendIds = friendships.map((f) =>
      f.requesterId === currentUserId ? f.addresseeId : f.requesterId,
    );
  }

  const excludeIds = [...(currentUserId ? [currentUserId] : []), ...friendIds];

  const and: Record<string, unknown>[] = [];
  if (search) {
    and.push({ username: { contains: search, mode: "insensitive" as const } });
    and.push({ isPublic: true });
  }
  if (excludeIds.length) and.push({ id: { notIn: excludeIds } });
  if (currentUsername?.trim()) {
    and.push({
      NOT: {
        username: { equals: currentUsername.trim(), mode: "insensitive" as const },
      },
    });
  }

  const where = and.length ? ({ AND: and } as never) : undefined;

  const users = await prisma.user.findMany({
    where,
    take: 10,
    orderBy: { createdAt: "desc" },
  });
  return users.map(stripPassword);
}

// Port of UserService.findOne — null when missing so the route can 404.
export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return stripPassword(user);
}

// Port of UserService.update — validates input, re-hashes a new password,
// 404 when the user does not exist.
export async function updateUser(id: string, input: unknown) {
  const dto = validateOrThrow(updateUserSchema, input);
  const data: Record<string, unknown> = { ...dto };
  if (typeof data.password === "string") {
    data.password = await bcrypt.hash(data.password, 10);
  }
  try {
    const user = await prisma.user.update({ where: { id }, data });
    return stripPassword(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      throw new AppError("User not found", 404);
    throw error;
  }
}

// Port of UserService.remove — 404 when the user does not exist.
export async function removeUser(id: string) {
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
}

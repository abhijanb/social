import { AppError } from "../../lib/errorHandler.js";
import { listCommentsPage } from "../../lib/comments.js";
import { ensureCanView, getFriendIds } from "../../lib/friends.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import {
  sendStreamCommentSchema,
  startStreamSchema,
} from "./livestream.schema.js";

const hostSelect = { id: true, username: true, avatarUrl: true } as const;
const commentAuthorSelect = { id: true, username: true, avatarUrl: true } as const;

const streamInclude = {
  host: { select: hostSelect },
} as const;

const commentInclude = {
  author: { select: commentAuthorSelect },
} as const;

// ensureCanWatch was unified into lib/friends ensureCanView (same guard,
// "Not friends with the host" message preserved at call sites).

async function getLiveStreamOrThrow(streamId: string) {
  const stream = await prisma.livestream.findUnique({
    where: { id: streamId },
    include: streamInclude,
  });
  if (!stream || stream.status !== "LIVE")
    throw new AppError("Stream ended or not found", 404);
  return stream;
}

// Start a livestream — one LIVE stream per user.
export async function startStream(hostId: string, input: unknown) {
  const dto = validateOrThrow(startStreamSchema, input);
  const existing = await prisma.livestream.findFirst({
    where: { hostId, status: "LIVE" },
    select: { id: true },
  });
  if (existing) throw new AppError("You are already live", 400);
  return prisma.livestream.create({
    data: { hostId, title: dto.title },
    include: streamInclude,
  });
}

// End a livestream — host only.
export async function endStream(hostId: string, streamId: string) {
  const stream = await prisma.livestream.findUnique({
    where: { id: streamId },
  });
  if (!stream || stream.status !== "LIVE")
    throw new AppError("Stream ended or not found", 404);
  if (stream.hostId !== hostId)
    throw new AppError("Only the host can end the stream", 403);
  return prisma.livestream.update({
    where: { id: streamId },
    data: { status: "ENDED", endedAt: new Date() },
    include: streamInclude,
  });
}

// List LIVE streams of self + ACCEPTED friends, newest first.
export async function listLive(meId: string) {
  const friendIds = await getFriendIds(meId);
  return prisma.livestream.findMany({
    where: { status: "LIVE", hostId: { in: [meId, ...friendIds] } },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }],
    include: streamInclude,
  });
}

// Get comments for a LIVE stream. Without sinceId returns the latest page
// (oldest first); with sinceId returns only strictly newer comments for
// cheap 1.5s incremental polling. cuids are not chronological, so the
// cursor resolves to its timestamp with id as tiebreak.
// Pagination shape lives in lib/comments; LIVE + friends guards stay here.
export async function getComments(
  viewerId: string,
  streamId: string,
  sinceId?: string,
  limit = 50,
) {
  const stream = await getLiveStreamOrThrow(streamId);
  await ensureCanView(viewerId, stream.hostId, "Not friends with the host");
  const fetchLatest = (take: number) =>
    prisma.livestreamComment.findMany({
      where: { streamId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: commentInclude,
    });
  return listCommentsPage({
    sinceId,
    limit,
    scopeId: streamId,
    fetchLatest,
    fetchCursor: async (id) => {
      const cursor = await prisma.livestreamComment.findUnique({
        where: { id },
        select: { createdAt: true, streamId: true },
      });
      // Unknown cursor (or one from another stream) → null falls back to
      // the latest page so the poller self-heals instead of stalling.
      return cursor ? { createdAt: cursor.createdAt, scopeId: cursor.streamId } : null;
    },
    fetchDelta: (take, createdAt, cursorId) =>
      prisma.livestreamComment.findMany({
        where: {
          streamId,
          OR: [
            { createdAt: { gt: createdAt } },
            { createdAt, id: { gt: cursorId } },
          ],
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take,
        include: commentInclude,
      }),
  });
}

// Post a comment to a LIVE stream (friends-only visibility).
export async function sendComment(
  authorId: string,
  streamId: string,
  input: unknown,
) {
  const dto = validateOrThrow(sendStreamCommentSchema, input);
  const stream = await getLiveStreamOrThrow(streamId);
  await ensureCanView(authorId, stream.hostId, "Not friends with the host");
  const comment = await prisma.livestreamComment.create({
    data: { streamId, authorId, text: dto.text },
    include: commentInclude,
  });
  return comment;
}

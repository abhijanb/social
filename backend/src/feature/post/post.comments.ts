import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { listCommentsPage } from "../../lib/comments.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import { ensureCanView } from "../../lib/friends.js";
import { sendPostCommentEmail } from "../notification/mailNotification.js";
import { notifyPostComment } from "../notification/notification.request.js";
import { createPostCommentSchema } from "./post.schema.js";

const log = logger.child({ service: "post" });

const commentAuthorSelect = { id: true, username: true, avatarUrl: true } as const;
const commentInclude = {
  author: { select: commentAuthorSelect },
} as const;

async function getPostOrThrow(postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);
  return post;
}

// Create a comment on a post — friends-only (same guard as viewing;
// commenting on your own posts is allowed).
export async function createPostComment(
  authorId: string,
  postId: string,
  input: unknown,
  idempotencyKey?: string,
) {
  const dto = validateOrThrow(createPostCommentSchema, input);
  const post = await getPostOrThrow(postId);
  await ensureCanView(authorId, post.authorId);
  if (idempotencyKey) {
    const existing = await prisma.postComment.findFirst({
      where: { postId, authorId, idempotencyKey, deletedAt: null },
      include: commentInclude,
    });
    if (existing) {
      log.info({ commentId: existing.id, postId, authorId }, "comment idempotency hit");
      return existing;
    }
  }
  const comment = await prisma.postComment.create({
    data: { postId, authorId, text: dto.text, idempotencyKey: idempotencyKey ?? null },
    include: commentInclude,
  });
  // Never notify for your own posts.
  if (post.authorId !== authorId) {
    await notifyPostComment(post.authorId, authorId, postId);
    sendPostCommentEmail(post.authorId, authorId).catch(() => {});
  }
  log.info({ commentId: comment.id, postId, authorId }, "comment created");
  return comment;
}

// List comments on a post — friends-only. Without sinceId returns the
// latest page (oldest first); with sinceId only strictly newer comments.
// Pagination shape lives in lib/comments; soft-delete scoping stays here.
export async function listPostComments(
  viewerId: string,
  postId: string,
  sinceId?: string,
  limit = 50,
) {
  const post = await getPostOrThrow(postId);
  await ensureCanView(viewerId, post.authorId);
  log.debug({ viewerId, postId, sinceId }, "comments list");
  const fetchLatest = (take: number) =>
    prisma.postComment.findMany({
      where: { postId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: commentInclude,
    });
  return listCommentsPage({
    sinceId,
    limit,
    scopeId: postId,
    fetchLatest,
    fetchCursor: async (id) => {
      const cursor = await prisma.postComment.findUnique({
        where: { id },
        select: { createdAt: true, postId: true },
      });
      return cursor ? { createdAt: cursor.createdAt, scopeId: cursor.postId } : null;
    },
    fetchDelta: (take, createdAt, cursorId) =>
      prisma.postComment.findMany({
        where: {
          postId,
          deletedAt: null,
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

// Soft-delete a comment — allowed for the comment author or the post
// author. Already-deleted reads as 404; lists/counts exclude deleted.
export async function deletePostComment(
  userId: string,
  postId: string,
  commentId: string,
) {
  log.debug({ userId, postId, commentId }, "comment delete");
  const comment = await prisma.postComment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, authorId: true, deletedAt: true },
  });
  if (!comment || comment.postId !== postId || comment.deletedAt)
    throw new AppError("Comment not found", 404);
  const post = await getPostOrThrow(postId);
  if (comment.authorId !== userId && post.authorId !== userId)
    throw new AppError("Not allowed to delete this comment", 403);
  await prisma.postComment.update({
    where: { id: commentId },
    data: { deletedAt: new Date() },
  });
  log.info({ commentId, postId, deletedBy: userId }, "comment deleted");
  return { id: commentId };
}

// Hard-delete soft-deleted comments older than the retention window
// (default 30 days). Comments hold text only — no files or children —
// so row removal is side-effect free. Runs from the soft-delete-purge
// schedule; also safe to call manually.
export async function purgeDeletedComments(
  olderThanDays = 30,
): Promise<{ deleted: number }> {
  log.debug({ olderThanDays }, "purge deleted comments");
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const res = await prisma.postComment.deleteMany({
    where: { deletedAt: { lte: cutoff } },
  });
  log.info({ deleted: res.count }, "purge deleted comments done");
  return { deleted: res.count };
}

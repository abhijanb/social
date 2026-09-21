import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { ensureCanView } from "../../lib/friends.js";
import { sendPostLikeEmail } from "../notification/mailNotification.js";
import { notifyPostLike } from "../notification/notification.request.js";

const log = logger.child({ service: "post" });

// Toggle the viewer's like on a post — friends-only (same guard as
// viewing; liking your own posts is allowed). Idempotent: liking twice
// unlikes. Returns the new state plus the fresh count.
export async function toggleLike(userId: string, postId: string) {
  log.debug({ userId, postId }, "like toggle");
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);
  await ensureCanView(userId, post.authorId);
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId, userId } });
    // Notify on like only (not unlike), and never for your own posts.
    if (post.authorId !== userId) {
      await notifyPostLike(post.authorId, userId, postId);
      sendPostLikeEmail(post.authorId, userId).catch(() => {});
    }
  }
  const likesCount = await prisma.postLike.count({ where: { postId } });
  return { liked: !existing, likesCount };
}

import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { ensureCanView, getFriendIds } from "../../lib/friends.js";
import { postInclude, withViewerState } from "./post.feed.js";
import { FEED_PAGE_SIZE, type FeedPage } from "./post.types.js";

const log = logger.child({ service: "post" });

// Toggle the viewer's save on a post — same visibility as viewing
// (friends-only; saving your own posts is allowed). Idempotent: saving
// twice unsaves. Saves are fully private: no count is ever exposed.
export async function toggleSave(userId: string, postId: string) {
  log.debug({ userId, postId }, "save toggle");
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new AppError("Post not found", 404);
  await ensureCanView(userId, post.authorId);
  const existing = await prisma.postSave.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.postSave.delete({ where: { id: existing.id } });
  } else {
    await prisma.postSave.create({ data: { postId, userId } });
  }
  return { saved: !existing };
}

// Saved posts — always the viewer's own (no authorId param), newest save
// first. Friends-only visibility still applies: saves of ex-friends' posts
// simply don't appear (their rows survive for a future re-friend).
export async function getSavedPosts(meId: string, page = 1): Promise<FeedPage> {
  log.debug({ meId, page }, "saved posts fetch");
  const p = Math.max(1, Math.floor(page) || 1);
  const saves = await prisma.postSave.findMany({
    where: { userId: meId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (p - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
    select: { postId: true },
  });
  const hasMore = saves.length > FEED_PAGE_SIZE;
  const pageSaves = hasMore ? saves.slice(0, FEED_PAGE_SIZE) : saves;
  if (pageSaves.length === 0) return { posts: [], nextPage: hasMore ? p + 1 : null };
  const friendIds = await getFriendIds(meId);
  const rows = await prisma.post.findMany({
    where: {
      id: { in: pageSaves.map((s) => s.postId) },
      authorId: { in: [meId, ...friendIds] },
    },
    include: postInclude,
  });
  const order = new Map(pageSaves.map((s, i) => [s.postId, i]));
  const ordered = [...rows].sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
  const posts = await withViewerState(ordered, meId);
  return { posts, nextPage: hasMore ? p + 1 : null };
}

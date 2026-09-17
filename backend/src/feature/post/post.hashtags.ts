import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { getFriendIds } from "../../lib/friends.js";
import { postInclude, withLikeState } from "./post.feed.js";
import { FEED_PAGE_SIZE, type FeedPage } from "./post.types.js";

function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").toLowerCase();
}

// Posts with a hashtag — friends-only: own + ACCEPTED friends' posts only,
// so private/stranger posts never leak through tag pages.
export async function getByHashtag(
  meId: string,
  rawTag: string,
  page = 1,
): Promise<FeedPage> {
  const tag = normalizeTag(rawTag);
  if (!tag) throw new AppError("tag required", 400);
  const friendIds = await getFriendIds(meId);
  const authorIds = [meId, ...friendIds];
  const p = Math.max(1, Math.floor(page) || 1);
  const rows = await prisma.post.findMany({
    where: {
      authorId: { in: authorIds },
      hashtags: { some: { hashtag: { tag } } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (p - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
    include: postInclude,
  });
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  const posts = await withLikeState(pageRows, meId);
  return { posts, nextPage: hasMore ? p + 1 : null };
}

// Hashtag autocomplete — global tag names only (no post contents),
// so counts don't leak private posts. Prefix match, most used first.
export async function searchHashtags(rawQ: string, limit = 10) {
  const q = normalizeTag(rawQ);
  if (!q) return [];
  const n = Math.min(20, Math.max(1, Math.floor(limit) || 10));
  const rows = await prisma.hashtag.findMany({
    where: { tag: { startsWith: q } },
    orderBy: [{ posts: { _count: "desc" } }, { tag: "asc" }],
    take: n,
    include: { _count: { select: { posts: true } } },
  });
  return rows.map((r) => ({ tag: r.tag, postsCount: r._count.posts }));
}

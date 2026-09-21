import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { ensureCanView, getFriendIds } from "../../lib/friends.js";
import { FEED_PAGE_SIZE, type FeedPage } from "./post.types.js";

const log = logger.child({ service: "post" });

const authorSelect = { id: true, username: true, avatarUrl: true } as const;
const imagesOrderBy = { order: "asc" } as const;
export const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: imagesOrderBy },
  _count: {
    select: { likes: true, comments: { where: { deletedAt: null } } },
  },
} as const;

// Maps Prisma rows (with _count.likes + _count.comments) to PostWithAuthor,
// resolving viewer-specific likedByMe/savedByMe with batched queries per page.
export async function withViewerState<
  T extends { id: string; _count: { likes: number; comments: number } },
>(rows: T[], meId: string) {
  if (rows.length === 0) {
    return rows.map(({ _count, ...rest }) => ({
      ...rest,
      likesCount: _count.likes,
      commentsCount: _count.comments,
      likedByMe: false,
      savedByMe: false,
    }));
  }
  const [liked, saved] = await Promise.all([
    prisma.postLike.findMany({
      where: { postId: { in: rows.map((r) => r.id) }, userId: meId },
      select: { postId: true },
    }),
    prisma.postSave.findMany({
      where: { postId: { in: rows.map((r) => r.id) }, userId: meId },
      select: { postId: true },
    }),
  ]);
  const likedIds = new Set(liked.map((l) => l.postId));
  const savedIds = new Set(saved.map((s) => s.postId));
  return rows.map(({ _count, ...rest }) => ({
    ...rest,
    likesCount: _count.likes,
    commentsCount: _count.comments,
    likedByMe: likedIds.has(rest.id),
    savedByMe: savedIds.has(rest.id),
  }));
}

async function findPage(
  meId: string,
  authorIds: string[],
  page = 1,
): Promise<FeedPage> {
  const p = Math.max(1, Math.floor(page) || 1);
  const rows = await prisma.post.findMany({
    where: { authorId: { in: authorIds } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (p - 1) * FEED_PAGE_SIZE,
    take: FEED_PAGE_SIZE + 1,
    include: postInclude,
  });
  const hasMore = rows.length > FEED_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  const posts = await withViewerState(pageRows, meId);
  return { posts, nextPage: hasMore ? p + 1 : null };
}

// Port of PostService.getFeed — own + ACCEPTED friends' posts.
export async function getFeed(meId: string, page = 1): Promise<FeedPage> {
  log.debug({ meId, page }, "feed fetch");
  const friendIds = await getFriendIds(meId);
  return findPage(meId, [meId, ...friendIds], page);
}

// Port of PostService.getByAuthor — friends-only (403 for strangers).
export async function getByAuthor(
  meId: string,
  authorId: string,
  page = 1,
): Promise<FeedPage> {
  log.debug({ meId, authorId, page }, "author timeline fetch");
  await ensureCanView(meId, authorId);
  return findPage(meId, [authorId], page);
}

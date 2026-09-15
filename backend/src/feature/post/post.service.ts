import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";

const authorSelect = { id: true, username: true } as const;
const imagesOrderBy = { order: "asc" } as const;
const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: imagesOrderBy },
  _count: { select: { likes: true } },
} as const;

/** Max attachments per post — mirrors multer MAX_IMAGES in post.upload.ts. */
export const MAX_POST_IMAGES = 10;

export type PostMediaKindDto = "IMAGE" | "VIDEO";

export type PostMediaInput = {
  url: string;
  kind: PostMediaKindDto;
};

/** Server-owned page size – clients cannot dictate it via query params. */
export const FEED_PAGE_SIZE = 20;

export type PostImageDto = {
  id: string;
  url: string;
  kind: PostMediaKindDto;
  order: number;
};

export type PostWithAuthor = {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
  author: { id: string; username: string };
  images: PostImageDto[];
  likesCount: number;
  likedByMe: boolean;
};

export type FeedPage = {
  posts: PostWithAuthor[];
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null;
};

async function getFriendIds(userId: string): Promise<string[]> {
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

async function ensureCanView(
  viewerId: string,
  authorId: string,
): Promise<void> {
  if (viewerId === authorId) return;
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: authorId },
        { requesterId: authorId, addresseeId: viewerId },
      ],
    },
  });
  if (!friendship) throw new AppError("Not friends", 403);
}

// Port of PostService.create — text, media, or both required.
// Accepts up to MAX_POST_IMAGES attachments, any mix of images and
// videos (Instagram-style carousel); upload order = display order.
export async function createPost(
  authorId: string,
  text: string,
  media: PostMediaInput[] = [],
) {
  const trimmed = text.trim();
  if (trimmed.length > 2200)
    throw new AppError("Post too long (max 2200 characters)", 400);
  if (media.length > MAX_POST_IMAGES)
    throw new AppError(`Max ${MAX_POST_IMAGES} attachments per post`, 400);
  if (!trimmed && media.length === 0)
    throw new AppError("Post needs text or at least one image or video", 400);
  const post = await prisma.post.create({
    data: {
      authorId,
      text: trimmed,
      images: {
        create: media.map((m, i) => ({ url: m.url, kind: m.kind, order: i })),
      },
    },
    include: postInclude,
  });
  const [withLikes] = await withLikeState([post], authorId);
  return withLikes;
}

// Toggle the viewer's like on a post — friends-only (same guard as
// viewing; liking your own posts is allowed). Idempotent: liking twice
// unlikes. Returns the new state plus the fresh count.
export async function toggleLike(userId: string, postId: string) {
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
  }
  const likesCount = await prisma.postLike.count({ where: { postId } });
  return { liked: !existing, likesCount };
}

// Port of PostService.getFeed — own + ACCEPTED friends' posts.
export async function getFeed(meId: string, page = 1): Promise<FeedPage> {
  const friendIds = await getFriendIds(meId);
  return findPage(meId, [meId, ...friendIds], page);
}

// Port of PostService.getByAuthor — friends-only (403 for strangers).
export async function getByAuthor(
  meId: string,
  authorId: string,
  page = 1,
): Promise<FeedPage> {
  await ensureCanView(meId, authorId);
  return findPage(meId, [authorId], page);
}

// Maps Prisma rows (with _count.likes) to PostWithAuthor, resolving
// likedByMe with a single batched query per page.
async function withLikeState<
  T extends { id: string; _count: { likes: number } },
>(rows: T[], meId: string) {
  const liked =
    rows.length > 0
      ? await prisma.postLike.findMany({
          where: { postId: { in: rows.map((r) => r.id) }, userId: meId },
          select: { postId: true },
        })
      : [];
  const likedIds = new Set(liked.map((l) => l.postId));
  return rows.map(({ _count, ...rest }) => ({
    ...rest,
    likesCount: _count.likes,
    likedByMe: likedIds.has(rest.id),
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
  const posts = await withLikeState(pageRows, meId);
  return { posts, nextPage: hasMore ? p + 1 : null };
}

import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";

const authorSelect = { id: true, username: true } as const;
const imagesOrderBy = { order: "asc" } as const;
const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: imagesOrderBy },
} as const;

/** Max images per post — mirrors multer MAX_IMAGES in post.upload.ts. */
export const MAX_POST_IMAGES = 10;

/** Server-owned page size – clients cannot dictate it via query params. */
export const FEED_PAGE_SIZE = 20;

export type PostImageDto = {
  id: string;
  url: string;
  order: number;
};

export type PostWithAuthor = {
  id: string;
  authorId: string;
  text: string;
  createdAt: Date;
  author: { id: string; username: string };
  images: PostImageDto[];
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

// Port of PostService.create — text, images, or both required.
// Accepts up to MAX_POST_IMAGES image URLs (Instagram-style carousel).
export async function createPost(
  authorId: string,
  text: string,
  imageUrls: string[] = [],
) {
  const trimmed = text.trim();
  if (trimmed.length > 2200)
    throw new AppError("Post too long (max 2200 characters)", 400);
  if (imageUrls.length > MAX_POST_IMAGES)
    throw new AppError(`Max ${MAX_POST_IMAGES} images per post`, 400);
  if (!trimmed && imageUrls.length === 0)
    throw new AppError("Post needs text or at least one image", 400);
  return prisma.post.create({
    data: {
      authorId,
      text: trimmed,
      images: {
        create: imageUrls.map((url, i) => ({ url, order: i })),
      },
    },
    include: postInclude,
  });
}

// Port of PostService.getFeed — own + ACCEPTED friends' posts.
export async function getFeed(meId: string, page = 1): Promise<FeedPage> {
  const friendIds = await getFriendIds(meId);
  return findPage([meId, ...friendIds], page);
}

// Port of PostService.getByAuthor — friends-only (403 for strangers).
export async function getByAuthor(
  meId: string,
  authorId: string,
  page = 1,
): Promise<FeedPage> {
  await ensureCanView(meId, authorId);
  return findPage([authorId], page);
}

async function findPage(
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
  const posts = hasMore ? rows.slice(0, FEED_PAGE_SIZE) : rows;
  return { posts, nextPage: hasMore ? p + 1 : null };
}

import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { validateOrThrow } from "../../lib/validate.js";
import { createPostCommentSchema } from "./post.schema.js";

const authorSelect = { id: true, username: true, avatarUrl: true } as const;
const commentAuthorSelect = { id: true, username: true, avatarUrl: true } as const;
const imagesOrderBy = { order: "asc" } as const;
const postInclude = {
  author: { select: authorSelect },
  images: { orderBy: imagesOrderBy },
  _count: {
    select: { likes: true, comments: { where: { deletedAt: null } } },
  },
} as const;
const commentInclude = {
  author: { select: commentAuthorSelect },
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
  author: { id: string; username: string; avatarUrl: string | null };
  images: PostImageDto[];
  likesCount: number;
  likedByMe: boolean;
  commentsCount: number;
};

export type FeedPage = {
  posts: PostWithAuthor[];
  /** Next page number, or null when there are no more pages. */
  nextPage: number | null;
};

/** Max comments returned per comments request (delta or initial page). */
export const POST_COMMENTS_PAGE_SIZE = 100;

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

// Maps Prisma rows (with _count.likes + _count.comments) to PostWithAuthor,
// resolving likedByMe with a single batched query per page.
async function withLikeState<
  T extends { id: string; _count: { likes: number; comments: number } },
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
    commentsCount: _count.comments,
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
) {
  const dto = validateOrThrow(createPostCommentSchema, input);
  const post = await getPostOrThrow(postId);
  await ensureCanView(authorId, post.authorId);
  return prisma.postComment.create({
    data: { postId, authorId, text: dto.text },
    include: commentInclude,
  });
}

// List comments on a post — friends-only. Without sinceId returns the
// latest page (oldest first); with sinceId only strictly newer comments.
export async function listPostComments(
  viewerId: string,
  postId: string,
  sinceId?: string,
  limit = 50,
) {
  const post = await getPostOrThrow(postId);
  await ensureCanView(viewerId, post.authorId);
  const n = Math.min(
    POST_COMMENTS_PAGE_SIZE,
    Math.max(1, Math.floor(limit) || 50),
  );
  if (!sinceId) {
    const latest = await prisma.postComment.findMany({
      where: { postId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: n,
      include: commentInclude,
    });
    return latest.reverse();
  }
  const cursor = await prisma.postComment.findUnique({
    where: { id: sinceId },
    select: { createdAt: true, postId: true },
  });
  if (!cursor || cursor.postId !== postId) {
    const latest = await prisma.postComment.findMany({
      where: { postId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: n,
      include: commentInclude,
    });
    return latest.reverse();
  }
  return prisma.postComment.findMany({
    where: {
      postId,
      deletedAt: null,
      OR: [
        { createdAt: { gt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { gt: sinceId } },
      ],
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: n,
    include: commentInclude,
  });
}

// Soft-delete a comment — allowed for the comment author or the post
// author. Already-deleted reads as 404; lists/counts exclude deleted.
export async function deletePostComment(
  userId: string,
  postId: string,
  commentId: string,
) {
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
  return { id: commentId };
}

// Delete a post — author only. PostImage/PostLike/PostComment rows cascade
// in the DB; returns file urls so the controller can unlink them from disk.
export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      authorId: true,
      images: { select: { url: true } },
    },
  });
  if (!post) throw new AppError("Post not found", 404);
  if (post.authorId !== userId)
    throw new AppError("Not allowed to delete this post", 403);
  await prisma.post.delete({ where: { id: postId } });
  return { id: postId, urls: post.images.map((i) => i.url) };
}

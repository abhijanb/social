import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { extractHashtags } from "../../lib/hashtags.js";
import { prisma } from "../../lib/prisma.js";
import { postInclude, withViewerState } from "./post.feed.js";
import {
  MAX_POST_IMAGES,
  type PostMediaInput,
} from "./post.types.js";

const log = logger.child({ service: "post" });

// Port of PostService.create — text, media, or both required.
// Accepts up to MAX_POST_IMAGES attachments, any mix of images and
// videos (Instagram-style carousel); upload order = display order.
// Hashtags (#tag) are extracted from text and linked via PostHashtag.
export async function createPost(
  authorId: string,
  text: string,
  media: PostMediaInput[] = [],
  idempotencyKey?: string,
) {
  const trimmed = text.trim();
  if (trimmed.length > 2200)
    throw new AppError("Post too long (max 2200 characters)", 400);
  if (media.length > MAX_POST_IMAGES)
    throw new AppError(`Max ${MAX_POST_IMAGES} attachments per post`, 400);
  if (!trimmed && media.length === 0)
    throw new AppError("Post needs text or at least one image or video", 400);
  if (idempotencyKey) {
    const existing = await prisma.post.findFirst({
      where: { authorId, idempotencyKey },
      include: postInclude,
    });
    if (existing) {
      const [withLikes] = await withViewerState([existing], authorId);
      log.info({ postId: existing.id, authorId }, "post idempotency hit");
      return withLikes;
    }
  }
  const tags = extractHashtags(trimmed);
  log.debug({ authorId, mediaCount: media.length, tagCount: tags.length }, "post create");
  const post = await prisma.post.create({
    data: {
      authorId,
      text: trimmed,
      idempotencyKey: idempotencyKey ?? null,
      images: {
        create: media.map((m, i) => ({ url: m.url, kind: m.kind, order: i })),
      },
      hashtags: {
        create: tags.map((tag) => ({
          hashtag: { connectOrCreate: { where: { tag }, create: { tag } } },
        })),
      },
    },
    include: postInclude,
  });
  const [withLikes] = await withViewerState([post], authorId);
  log.info({ postId: post.id, authorId }, "post created");
  return withLikes;
}

// Delete a post — author only. PostImage/PostLike/PostComment rows cascade
// in the DB; returns file urls so the controller can unlink them from disk.
export async function deletePost(userId: string, postId: string) {
  log.debug({ userId, postId }, "post delete");
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
  log.info({ postId, userId }, "post deleted");
  return { id: postId, urls: post.images.map((i) => i.url) };
}

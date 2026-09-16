import { z } from "zod";

// Used by POST /post (multipart text field). Optional here — the service
// enforces "text or image" so image-only posts work. Port of
// back/src/post/dto/create-post.dto.ts.
export const createPostSchema = z.object({
  text: z.string().trim().max(2200).optional().default(""),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;

// Used by GET /post/feed?page=. Page is client-hinted only; page size is
// server-owned (FEED_PAGE_SIZE) so clients cannot dictate it.
export const feedQuerySchema = z.object({
  page: z.string().optional().default("1"),
});

export type FeedQueryDto = z.infer<typeof feedQuerySchema>;

// Used by GET /post?authorId=&page=. authorId required (friends-only,
// enforced in the service).
export const authorPostsQuerySchema = z.object({
  authorId: z.string().trim().min(1, "authorId required"),
  page: z.string().optional().default("1"),
});

export type AuthorPostsQueryDto = z.infer<typeof authorPostsQuerySchema>;

// Used by POST /post/:id/like. Rejecting non-cuids here turns a Prisma
// throw into a clean 400 (mirrors the friendship id param schema).
export const postIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type PostIdParamDto = z.infer<typeof postIdParamSchema>;

// Used by DELETE /post/:id/comments/:commentId.
export const postCommentParamSchema = z.object({
  id: z.string().cuid(),
  commentId: z.string().cuid(),
});

export type PostCommentParamDto = z.infer<typeof postCommentParamSchema>;

// Used by GET /post/:id/comments?sinceId=&limit=. Without sinceId returns
// the latest page (oldest first); with sinceId only newer comments.
export const postCommentsQuerySchema = z.object({
  sinceId: z.string().trim().min(1).optional(),
  limit: z.string().optional().default("50"),
});

export type PostCommentsQueryDto = z.infer<typeof postCommentsQuerySchema>;

// Used by POST /post/:id/comments. Instagram-style short comments.
export const createPostCommentSchema = z.object({
  text: z.string().trim().min(1, "Comment cannot be empty").max(500),
});

export type CreatePostCommentDto = z.infer<typeof createPostCommentSchema>;

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

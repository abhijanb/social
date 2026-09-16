import { z } from "zod";

// Used by POST /story (multipart text field). Media is required (single
// file under field "media"); text is an optional caption.
export const createStorySchema = z.object({
  text: z.string().trim().max(220).optional().default(""),
});

export type CreateStoryDto = z.infer<typeof createStorySchema>;

// Used by GET /story?authorId=. authorId required (friends-only,
// enforced in the service).
export const authorStoriesQuerySchema = z.object({
  authorId: z.string().trim().min(1, "authorId required"),
});

export type AuthorStoriesQueryDto = z.infer<typeof authorStoriesQuerySchema>;

// Used by routes with :id (view, delete).
export const storyIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type StoryIdParamDto = z.infer<typeof storyIdParamSchema>;

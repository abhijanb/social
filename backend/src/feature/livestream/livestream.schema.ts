import { z } from "zod";

// Used by routes with :id (end stream, comments). Mirrors the
// friendship/user id param schemas.
export const streamIdParamSchema = z.object({
  id: z.string().trim().min(1, "id required"),
});

export type StreamIdParamDto = z.infer<typeof streamIdParamSchema>;

// Used by POST /livestream/start.
export const startStreamSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(100),
});

export type StartStreamDto = z.infer<typeof startStreamSchema>;

// Used by GET /livestream/:id/comments?sinceId=&limit=. Returns comments
// newer than the cursor (incremental polling); without sinceId returns
// the latest page. Limit clamps to 1-100, default 50.
export const streamCommentsQuerySchema = z.object({
  sinceId: z.string().trim().min(1).optional(),
  limit: z.string().optional().default("50"),
});

export type StreamCommentsQueryDto = z.infer<typeof streamCommentsQuerySchema>;

// Used by POST /livestream/:id/comments. Short live-chat style comments.
export const sendStreamCommentSchema = z.object({
  text: z.string().trim().min(1, "Comment cannot be empty").max(500),
});

export type SendStreamCommentDto = z.infer<typeof sendStreamCommentSchema>;

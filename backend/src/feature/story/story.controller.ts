import type { Response } from "express";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { MAX_IMAGE_BYTES } from "../post/post.upload.js";
import {
  cleanupExpired,
  createStory,
  deleteStory,
  getByAuthor,
  getStoryFeed,
  markViewed,
} from "./story.service.js";
import type { StoryMediaKindDto } from "./story.service.js";
import {
  authorStoriesQuerySchema,
  createStorySchema,
  storyIdParamSchema,
} from "./story.schema.js";

// POST /story — single media (field "media") + optional text caption.
// uploadStoryMedia runs first; the controller enforces the tighter
// image cap and cleans up rejected files.
export async function createStoryController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const dto = validateOrThrow(createStorySchema, req.body);
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  if (!file) throw new AppError("Story needs an image or video", 400);
  if (!file.mimetype.startsWith("video/") && file.size > MAX_IMAGE_BYTES) {
    await unlink(join(process.cwd(), "uploads", file.filename)).catch(
      () => {},
    );
    throw new AppError("Image too large (max 5MB per image)", 400);
  }
  const media = {
    url: `/uploads/${file.filename}`,
    kind: (file.mimetype.startsWith("video/")
      ? "VIDEO"
      : "IMAGE") as StoryMediaKindDto,
  };
  const story = await createStory(req.user.id, dto.text, media);
  return responseCreated(res, story, "Story created");
}

// GET /story/feed — own + friends' active stories grouped by author.
export async function getStoryFeedController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  return responseSuccess(res, await getStoryFeed(req.user.id));
}

// GET /story?authorId= — active stories by one author (friends-only).
export async function getByAuthorController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { authorId } = validateOrThrow(authorStoriesQuerySchema, req.query);
  return responseSuccess(res, await getByAuthor(req.user.id, authorId.trim()));
}

// POST /story/:id/view — mark as viewed (friends-only, idempotent).
export async function markViewedController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(storyIdParamSchema, req.params);
  return responseSuccess(res, await markViewed(req.user.id, id));
}

// DELETE /story/:id — author only, unlinks the file from disk.
export async function deleteStoryController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(storyIdParamSchema, req.params);
  const { url } = await deleteStory(req.user.id, id);
  if (url.startsWith("/uploads/")) {
    await unlink(join(process.cwd(), url.slice(1))).catch(() => {});
  }
  return responseSuccess(res, { id }, "Story deleted");
}

// POST /story/cleanup — delete expired stories (called by the hourly
// timer; exposed for admins/manual runs, auth required).
export async function cleanupController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  return responseSuccess(res, await cleanupExpired(), "Cleanup done");
}

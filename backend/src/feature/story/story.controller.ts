import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { withLogging, withCleanup } from "../../lib/asyncHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import {
  deleteUploadFiles,
  findOversizedImage,
  uploadUrl,
} from "../../lib/uploads.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  createStory,
  deleteStory,
  getByAuthor,
  getStoryFeed,
  markViewed,
  softDeleteExpiredStories,
} from "./story.service.js";
import type { StoryMediaKindDto } from "./story.service.js";
import {
  authorStoriesQuerySchema,
  createStorySchema,
  storyIdParamSchema,
} from "./story.schema.js";

// POST /story — single media (field "media") + optional text caption.
// uploadStoryMedia runs first; the controller enforces the tighter
// image cap and cleans up rejected files. withCleanup deletes the
// uploaded file on any thrown error so rejected uploads leave no orphans.
export const createStoryController = withCleanup(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const dto = validateOrThrow(createStorySchema, req.body);
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    if (!file) throw new AppError("Story needs an image or video", 400);
    if (findOversizedImage([file])) {
      throw new AppError("Image too large (max 5MB per image)", 400);
    }
    const media = {
      url: uploadUrl(file.filename),
      kind: (file.mimetype.startsWith("video/")
        ? "VIDEO"
        : "IMAGE") as StoryMediaKindDto,
    };
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const story = await createStory(req.user.id, dto.text, media, idempotencyKey);
    if (idempotencyKey && story.url !== media.url) {
      await deleteUploadFiles([file.filename]);
    }
    return responseCreated(res, story, "Story created");
  },
  "create-story",
  (req) => ({ userId: req.user?.id }),
  (req) => {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    return file ? deleteUploadFiles([file.filename]) : Promise.resolve();
  },
);

// GET /story/feed — own + friends' active stories grouped by author.
export const getStoryFeedController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    return responseSuccess(res, await getStoryFeed(req.user.id));
  },
  "story-feed",
  (req) => ({ userId: req.user?.id }),
);

// GET /story?authorId= — active stories by one author (friends-only).
export const getByAuthorController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { authorId } = validateOrThrow(authorStoriesQuerySchema, req.query);
    return responseSuccess(res, await getByAuthor(req.user.id, authorId.trim()));
  },
  "stories-by-author",
  (req) => ({ userId: req.user?.id, authorId: req.query.authorId }),
);

// POST /story/:id/view — mark as viewed (friends-only, idempotent).
export const markViewedController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(storyIdParamSchema, req.params);
    return responseSuccess(res, await markViewed(req.user.id, id));
  },
  "story-view",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

// DELETE /story/:id — author only, soft-deletes (invisible immediately,
// hard-deleted with its file by the 30-day purge).
export const deleteStoryController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(storyIdParamSchema, req.params);
    return responseSuccess(res, await deleteStory(req.user.id, id), "Story deleted");
  },
  "delete-story",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

// POST /story/cleanup — soft-delete expired stories (called by the hourly
// timer; exposed for admins/manual runs, auth required).
export const cleanupController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    return responseSuccess(res, await softDeleteExpiredStories(), "Cleanup done");
  },
  "story-cleanup",
  (req) => ({ userId: req.user?.id }),
);

import type { Response } from "express";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { createPost, getByAuthor, getFeed } from "./post.service.js";
import type { PostMediaInput } from "./post.service.js";
import {
  authorPostsQuerySchema,
  createPostSchema,
  feedQuerySchema,
} from "./post.schema.js";
import { MAX_IMAGE_BYTES } from "./post.upload.js";

// POST /post — multipart text + optional media attachments (up to 10,
// any mix of images/videos, uploadImage runs first).
// Port of PostController.create (behind requireAuth).
export async function createPostController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const dto = validateOrThrow(createPostSchema, req.body);
  const files = (req as AuthRequest & { files?: Express.Multer.File[] }).files;
  const list = Array.isArray(files) ? files : [];
  // Multer caps every file at the video limit; enforce the tighter
  // image cap here. On failure delete the just-uploaded files so
  // rejected uploads don't leave orphans on disk.
  const oversized = list.find(
    (f) => !f.mimetype.startsWith("video/") && f.size > MAX_IMAGE_BYTES,
  );
  if (oversized) {
    await Promise.allSettled(
      list.map((f) => unlink(join(process.cwd(), "uploads", f.filename))),
    );
    throw new AppError("Image too large (max 5MB per image)", 400);
  }
  const media: PostMediaInput[] = list.map((f) => ({
    url: `/uploads/${f.filename}`,
    kind: f.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE",
  }));
  const post = await createPost(req.user.id, dto.text, media);
  return responseCreated(res, post, "Post created");
}

// GET /post/feed?page= — own + friends' posts. Port of PostController.getFeed.
export async function getFeedController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { page } = validateOrThrow(feedQuerySchema, req.query);
  return responseSuccess(res, await getFeed(req.user.id, Number(page)));
}

// GET /post?authorId=&page= — friends-only author timeline.
// Port of PostController.getByAuthor.
export async function getByAuthorController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { authorId, page } = validateOrThrow(
    authorPostsQuerySchema,
    req.query,
  );
  return responseSuccess(
    res,
    await getByAuthor(req.user.id, authorId.trim(), Number(page)),
  );
}

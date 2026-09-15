import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { createPost, getByAuthor, getFeed } from "./post.service.js";
import {
  authorPostsQuerySchema,
  createPostSchema,
  feedQuerySchema,
} from "./post.schema.js";

// POST /post — multipart text + optional images (up to 10, uploadImage runs
// first). Port of PostController.create (behind requireAuth).
export async function createPostController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const dto = validateOrThrow(createPostSchema, req.body);
  const files = (req as AuthRequest & { files?: Express.Multer.File[] }).files;
  const imageUrls = Array.isArray(files)
    ? files.map((f) => `/uploads/${f.filename}`)
    : [];
  const post = await createPost(req.user.id, dto.text, imageUrls);
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

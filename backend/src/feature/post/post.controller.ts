import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import {
  deleteUploadFiles,
  deleteUploadUrls,
  findOversizedImage,
  uploadUrl,
} from "../../lib/uploads.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { createPost, deletePost, getByAuthor, getByHashtag, getFeed, searchHashtags, toggleLike } from "./post.service.js";
import {
  createPostComment,
  deletePostComment,
  listPostComments,
} from "./post.service.js";
import type { PostMediaInput } from "./post.service.js";
import {
  authorPostsQuerySchema,
  byHashtagQuerySchema,
  createPostSchema,
  feedQuerySchema,
  hashtagSearchQuerySchema,
  postCommentParamSchema,
  postCommentsQuerySchema,
  postIdParamSchema,
} from "./post.schema.js";

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
  const oversized = findOversizedImage(list);
  if (oversized) {
    await deleteUploadFiles(list.map((f) => f.filename));
    throw new AppError("Image too large (max 5MB per image)", 400);
  }
  const media: PostMediaInput[] = list.map((f) => ({
    url: uploadUrl(f.filename),
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

// POST /post/:id/like — toggle the viewer's like (friends-only, same
// guard as viewing; self-likes allowed). Returns { liked, likesCount }.
export async function toggleLikeController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(postIdParamSchema, req.params);
  return responseSuccess(res, await toggleLike(req.user.id, id));
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

// POST /post/:id/comments — comment on a post (friends-only).
export async function createPostCommentController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(postIdParamSchema, req.params);
  return responseCreated(
    res,
    await createPostComment(req.user.id, id, req.body),
    "Comment created",
  );
}

// GET /post/:id/comments?sinceId=&limit= — latest page or delta.
export async function listPostCommentsController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(postIdParamSchema, req.params);
  const { sinceId, limit } = validateOrThrow(
    postCommentsQuerySchema,
    req.query,
  );
  return responseSuccess(
    res,
    await listPostComments(req.user.id, id, sinceId, Number(limit)),
  );
}

// DELETE /post/:id/comments/:commentId — comment author or post author.
export async function deletePostCommentController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id, commentId } = validateOrThrow(postCommentParamSchema, req.params);
  return responseSuccess(
    res,
    await deletePostComment(req.user.id, id, commentId),
    "Comment deleted",
  );
}

// DELETE /post/:id — author only, unlinks media files from disk.
export async function deletePostController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(postIdParamSchema, req.params);
  const { urls } = await deletePost(req.user.id, id);
  await deleteUploadUrls(urls);
  return responseSuccess(res, { id }, "Post deleted");
}

// GET /post/by-hashtag?tag=&page= — friends-only tag feed.
export async function getByHashtagController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { tag, page } = validateOrThrow(byHashtagQuerySchema, req.query);
  return responseSuccess(res, await getByHashtag(req.user.id, tag, Number(page)));
}

// GET /post/hashtags/search?q=&limit= — tag autocomplete.
export async function searchHashtagsController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { q, limit } = validateOrThrow(hashtagSearchQuerySchema, req.query);
  return responseSuccess(res, await searchHashtags(q, Number(limit)));
}

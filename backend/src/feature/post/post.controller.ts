import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import {
  deleteUploadFiles,
  deleteUploadUrls,
  findOversizedImage,
  uploadUrl,
} from "../../lib/uploads.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { createPost, deletePost } from "./post.service.js";
import { getByAuthor, getFeed } from "./post.feed.js";
import { getByHashtag, searchHashtags } from "./post.hashtags.js";
import { toggleLike } from "./post.likes.js";
import { getSavedPosts, toggleSave } from "./post.saves.js";
import {
  createPostComment,
  deletePostComment,
  listPostComments,
} from "./post.comments.js";
import type { PostMediaInput } from "./post.types.js";
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

const log = logger.child({ controller: "post" });

// POST /post — multipart text + optional media attachments (up to 10,
// any mix of images/videos, uploadImage runs first).
// Port of PostController.create (behind requireAuth).
export const createPostController = withLogging(
  async (req: AuthRequest, res: Response) => {
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
    log.info({ userId: req.user.id, mediaCount: media.length }, "post create");
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    const post = await createPost(req.user.id, dto.text, media, idempotencyKey);
    log.info({ postId: post.id, userId: req.user.id }, "post created");
    return responseCreated(res, post, "Post created");
  },
  "create-post",
  (req) => ({ userId: req.user?.id }),
);

// GET /post/feed?page= — own + friends' posts. Port of PostController.getFeed.
export const getFeedController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { page } = validateOrThrow(feedQuerySchema, req.query);
    log.debug({ userId: req.user.id, page }, "feed fetch");
    return responseSuccess(res, await getFeed(req.user.id, Number(page)));
  },
  "get-feed",
  (req) => ({ userId: req.user?.id, page: req.query.page }),
);

// POST /post/:id/like — toggle the viewer's like (friends-only, same
// guard as viewing; self-likes allowed). Returns { liked, likesCount }.
export const toggleLikeController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(postIdParamSchema, req.params);
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    log.debug({ userId: req.user.id, postId: id }, "like toggle");
    return responseSuccess(res, await toggleLike(req.user.id, id, idempotencyKey));
  },
  "toggle-like",
  (req) => ({ userId: req.user?.id, postId: req.params.id }),
);

// POST /post/:id/save — toggle the viewer's save (friends-only, same
// guard as viewing; self-saves allowed). Returns { saved } — no count,
// saves are fully private.
export const toggleSaveController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(postIdParamSchema, req.params);
    log.debug({ userId: req.user.id, postId: id }, "save toggle");
    return responseSuccess(res, await toggleSave(req.user.id, id));
  },
  "toggle-save",
  (req) => ({ userId: req.user?.id, postId: req.params.id }),
);

// GET /post/saved?page= — viewer's own saved posts, newest save first.
export const getSavedPostsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { page } = validateOrThrow(feedQuerySchema, req.query);
    log.debug({ userId: req.user.id, page }, "saved posts fetch");
    return responseSuccess(res, await getSavedPosts(req.user.id, Number(page)));
  },
  "saved-posts",
  (req) => ({ userId: req.user?.id, page: req.query.page }),
);

// GET /post?authorId=&page= — friends-only author timeline.
// Port of PostController.getByAuthor.
export const getByAuthorController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { authorId, page } = validateOrThrow(
      authorPostsQuerySchema,
      req.query,
    );
    log.debug({ viewerId: req.user.id, authorId, page }, "author timeline fetch");
    return responseSuccess(
      res,
      await getByAuthor(req.user.id, authorId.trim(), Number(page)),
    );
  },
  "author-timeline",
  (req) => ({
    userId: req.user?.id,
    authorId: req.query.authorId,
    page: req.query.page,
  }),
);

// POST /post/:id/comments — comment on a post (friends-only).
export const createPostCommentController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(postIdParamSchema, req.params);
    log.info({ userId: req.user.id, postId: id }, "comment create");
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    return responseCreated(
      res,
      await createPostComment(req.user.id, id, req.body, idempotencyKey),
      "Comment created",
    );
  },
  "create-comment",
  (req) => ({ userId: req.user?.id, postId: req.params.id }),
);

// GET /post/:id/comments?sinceId=&limit= — latest page or delta.
export const listPostCommentsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(postIdParamSchema, req.params);
    const { sinceId, limit } = validateOrThrow(
      postCommentsQuerySchema,
      req.query,
    );
    log.debug({ viewerId: req.user.id, postId: id, sinceId }, "comments list");
    return responseSuccess(
      res,
      await listPostComments(req.user.id, id, sinceId, Number(limit)),
    );
  },
  "list-comments",
  (req) => ({
    userId: req.user?.id,
    postId: req.params.id,
    sinceId: req.query.sinceId,
  }),
);

// DELETE /post/:id/comments/:commentId — comment author or post author.
export const deletePostCommentController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id, commentId } = validateOrThrow(postCommentParamSchema, req.params);
    log.info({ userId: req.user.id, postId: id, commentId }, "comment delete");
    return responseSuccess(
      res,
      await deletePostComment(req.user.id, id, commentId),
      "Comment deleted",
    );
  },
  "delete-comment",
  (req) => ({
    userId: req.user?.id,
    postId: req.params.id,
    commentId: req.params.commentId,
  }),
);

// DELETE /post/:id — author only, unlinks media files from disk.
export const deletePostController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(postIdParamSchema, req.params);
    log.info({ userId: req.user.id, postId: id }, "post delete");
    const { urls } = await deletePost(req.user.id, id);
    await deleteUploadUrls(urls);
    return responseSuccess(res, { id }, "Post deleted");
  },
  "delete-post",
  (req) => ({ userId: req.user?.id, postId: req.params.id }),
);

// GET /post/by-hashtag?tag=&page= — friends-only tag feed.
export const getByHashtagController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { tag, page } = validateOrThrow(byHashtagQuerySchema, req.query);
    log.debug({ viewerId: req.user.id, tag, page }, "hashtag feed fetch");
    return responseSuccess(res, await getByHashtag(req.user.id, tag, Number(page)));
  },
  "hashtag-feed",
  (req) => ({
    userId: req.user?.id,
    tag: req.query.tag,
    page: req.query.page,
  }),
);

// GET /post/hashtags/search?q=&limit= — tag autocomplete.
export const searchHashtagsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { q, limit } = validateOrThrow(hashtagSearchQuerySchema, req.query);
    log.debug({ q, limit }, "hashtag search");
    return responseSuccess(res, await searchHashtags(q, Number(limit)));
  },
  "hashtag-search",
  (req) => ({
    userId: req.user?.id,
    q: req.query.q,
    limit: req.query.limit,
  }),
);

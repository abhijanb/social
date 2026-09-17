import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  createPostCommentController,
  createPostController,
  deletePostCommentController,
  deletePostController,
  getByAuthorController,
  getByHashtagController,
  getFeedController,
  getSavedPostsController,
  listPostCommentsController,
  searchHashtagsController,
  toggleLikeController,
  toggleSaveController,
} from "./post.controller.js";
import { uploadImage } from "./post.upload.js";

export const postRouter = Router();

// NOTE: static GETs (/feed, /saved, ...) are registered before / so they
// are never parsed as a query-less author timeline.
postRouter.post("/", requireAuth, uploadImage, createPostController);
postRouter.get("/feed", requireAuth, getFeedController);
postRouter.get("/saved", requireAuth, getSavedPostsController);
postRouter.get("/by-hashtag", requireAuth, getByHashtagController);
postRouter.get("/hashtags/search", requireAuth, searchHashtagsController);
postRouter.post("/:id/like", requireAuth, toggleLikeController);
postRouter.post("/:id/save", requireAuth, toggleSaveController);
postRouter.get("/:id/comments", requireAuth, listPostCommentsController);
postRouter.post("/:id/comments", requireAuth, createPostCommentController);
postRouter.delete(
  "/:id/comments/:commentId",
  requireAuth,
  deletePostCommentController,
);
postRouter.delete("/:id", requireAuth, deletePostController);
postRouter.get("/", requireAuth, getByAuthorController);

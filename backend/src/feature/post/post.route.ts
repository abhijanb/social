import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  createPostController,
  getByAuthorController,
  getFeedController,
} from "./post.controller.js";
import { uploadImage } from "./post.upload.js";

export const postRouter = Router();

// NOTE: /feed is registered before / so "feed" is never parsed as a query-less
// author timeline (mirrors the Nest controller order).
postRouter.post("/", requireAuth, uploadImage, createPostController);
postRouter.get("/feed", requireAuth, getFeedController);
postRouter.get("/", requireAuth, getByAuthorController);

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { interactLimiter, uploadLimiter } from "../../middleware/rateLimit.js";
import {
  cleanupController,
  createStoryController,
  deleteStoryController,
  getByAuthorController,
  getStoryFeedController,
  markViewedController,
} from "./story.controller.js";
import { uploadStoryMedia } from "./story.upload.js";

export const storyRouter = Router();

// NOTE: /feed and /cleanup are registered before / so they are never
// parsed as query-less author timelines (mirrors the post router).
// NOTE: limiter runs before multer so rejected uploads never touch disk.
storyRouter.post("/", requireAuth, uploadLimiter, uploadStoryMedia, createStoryController);
storyRouter.get("/feed", requireAuth, getStoryFeedController);
storyRouter.post("/cleanup", requireAuth, cleanupController);
storyRouter.post("/:id/view", requireAuth, interactLimiter, markViewedController);
storyRouter.delete("/:id", requireAuth, deleteStoryController);
storyRouter.get("/", requireAuth, getByAuthorController);

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  endStreamController,
  getCommentsController,
  listLiveController,
  sendCommentController,
  startStreamController,
} from "./livestream.controller.js";

export const livestreamRouter = Router();

// NOTE: /live is registered before /:id/* so "live" is never parsed
// as a stream id (mirrors the post router's /feed ordering).
livestreamRouter.post("/start", requireAuth, startStreamController);
livestreamRouter.get("/live", requireAuth, listLiveController);
livestreamRouter.post("/:id/end", requireAuth, endStreamController);
livestreamRouter.get("/:id/comments", requireAuth, getCommentsController);
livestreamRouter.post("/:id/comments", requireAuth, sendCommentController);

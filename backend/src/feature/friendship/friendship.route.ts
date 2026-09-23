import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { sendLimiter } from "../../middleware/rateLimit.js";
import {
  acceptFriendshipController,
  createFriendshipController,
  deleteFriendshipController,
  getFriendshipController,
  listFriendshipsController,
  listPendingController,
  updateFriendshipController,
} from "./friendship.controller.js";

export const friendshipRouter = Router();

// NOTE: /pending is registered before /:id so "pending" is not
// captured as an id param (same order as the Nest controller).
friendshipRouter.post("/", requireAuth, sendLimiter, createFriendshipController);
friendshipRouter.get("/", requireAuth, listFriendshipsController);
friendshipRouter.get("/pending", requireAuth, listPendingController);
friendshipRouter.get("/:id", requireAuth, getFriendshipController);
friendshipRouter.patch("/:id", requireAuth, updateFriendshipController);
friendshipRouter.patch("/:id/accept", requireAuth, acceptFriendshipController);
friendshipRouter.delete("/:id", requireAuth, deleteFriendshipController);

import { Router } from "express";
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
friendshipRouter.post("/", createFriendshipController);
friendshipRouter.get("/", listFriendshipsController);
friendshipRouter.get("/pending", listPendingController);
friendshipRouter.get("/:id", getFriendshipController);
friendshipRouter.patch("/:id", updateFriendshipController);
friendshipRouter.patch("/:id/accept", acceptFriendshipController);
friendshipRouter.delete("/:id", deleteFriendshipController);

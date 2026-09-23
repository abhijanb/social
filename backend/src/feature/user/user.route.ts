import { Router } from "express";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import { searchLimiter, uploadLimiter } from "../../middleware/rateLimit.js";
import {
  deleteUserController,
  getUserByUsernameController,
  getUserController,
  listUsersController,
  updateMeController,
} from "./user.controller.js";
import { uploadAvatar } from "./user.upload.js";

export const userRouter = Router();

userRouter.get("/", attachUser, searchLimiter, listUsersController);
userRouter.patch("/me", requireAuth, uploadLimiter, uploadAvatar, updateMeController);
// NOTE: by-username before /:id so "by-username" is never parsed as an id
// (mirrors the post /feed and story /feed ordering).
userRouter.get("/by-username/:username", requireAuth, getUserByUsernameController);
userRouter.get("/:id", requireAuth, getUserController);
userRouter.delete("/:id", requireAuth, deleteUserController);

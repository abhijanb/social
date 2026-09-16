import { Router } from "express";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import {
  deleteUserController,
  getUserByUsernameController,
  getUserController,
  listUsersController,
  updateMeController,
} from "./user.controller.js";

export const userRouter = Router();

userRouter.get("/", attachUser, listUsersController);
userRouter.patch("/me", requireAuth, updateMeController);
// NOTE: by-username before /:id so "by-username" is never parsed as an id
// (mirrors the post /feed and story /feed ordering).
userRouter.get("/by-username/:username", requireAuth, getUserByUsernameController);
userRouter.get("/:id", requireAuth, getUserController);
userRouter.delete("/:id", requireAuth, deleteUserController);

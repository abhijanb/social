import { Router } from "express";
import { attachUser, requireAuth } from "../../middleware/auth.js";
import {
  deleteUserController,
  getUserController,
  listUsersController,
  updateMeController,
} from "./user.controller.js";

export const userRouter = Router();

userRouter.get("/", attachUser, listUsersController);
userRouter.patch("/me", requireAuth, updateMeController);
userRouter.get("/:id", requireAuth, getUserController);
userRouter.delete("/:id", requireAuth, deleteUserController);

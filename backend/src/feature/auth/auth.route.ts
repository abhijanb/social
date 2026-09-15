import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/", registerController);
authRouter.post("/login", loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", meController);

import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit.js";
import {
  loginController,
  logoutController,
  meController,
  registerController,
  resendVerificationController,
  verifyEmailController,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/", authLimiter, registerController);
authRouter.post("/login", authLimiter, loginController);
authRouter.post("/logout", logoutController);
authRouter.get("/me", meController);
authRouter.get("/verify-email", verifyEmailController);
authRouter.post("/verify-email/resend", authLimiter, resendVerificationController);

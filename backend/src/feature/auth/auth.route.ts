import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import {
  listSessionsController,
  loginController,
  logoutAllController,
  logoutController,
  meController,
  registerController,
  resendVerificationController,
  revokeSessionController,
  verifyEmailController,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/", authLimiter, registerController);
authRouter.post("/login", authLimiter, loginController);
authRouter.post("/logout", logoutController);
authRouter.post("/logout-all", requireAuth, logoutAllController);
authRouter.get("/sessions", requireAuth, listSessionsController);
authRouter.delete("/sessions/:id", requireAuth, revokeSessionController);
authRouter.get("/me", requireAuth, meController);
authRouter.get("/verify-email", verifyEmailController);
authRouter.post("/verify-email/resend", authLimiter, resendVerificationController);

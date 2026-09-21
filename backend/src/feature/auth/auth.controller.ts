import { type Request, type Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
import { signToken, verifyToken } from "../../lib/jwt.js";
import type { JwtPayload } from "../../lib/jwt.js";
import {
  responseCreated,
  responseSuccess,
} from "../../lib/response.js";
import { findUserById, login, register, verifyEmail, resendVerification } from "./auth.service.js";
import { sendVerificationEmail, sendWelcomeEmail } from "../notification/mailNotification.js";

function getCurrentUser(req: Request): JwtPayload | null {
  const token =
    (req.cookies as Record<string, string> | undefined)?.token ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.id || !payload?.username) return null;
  return payload;
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

const log = logger.child({ controller: "auth" });

// POST /user — register. Does NOT set the auth cookie; the user must
// verify their email before logging in (login blocks unverified users).
export const registerController = withLogging(
  async (req: Request, res: Response) => {
    log.info({ username: (req.body as { username?: string })?.username }, "register request");
    const { user } = await register(req.body);
    log.info({ userId: user.id }, "register success");
    const verificationToken = signToken({ id: user.id, username: user.username }, "24h");
    sendVerificationEmail(user.id, verificationToken).catch(() => {});
    sendWelcomeEmail(user.id, user.username).catch(() => {});
    return responseCreated(res, user, "Registered successfully");
  },
  "register",
  (req) => ({ username: (req.body as { username?: string })?.username }),
);

// GET /user/verify-email — verify email via token.
export const verifyEmailController = withLogging(
  async (req: Request, res: Response) => {
    const token = (req.query.token as string) ?? "";
    if (!token) throw new AppError("Token required", 400);
    await verifyEmail(token);
    return responseSuccess(res, null, "Email verified successfully");
  },
  "verify-email",
);

// POST /user/verify-email/resend — resend verification email.
// No auth required — username provided in body.
export const resendVerificationController = withLogging(
  async (req: Request, res: Response) => {
    const { username } = (req.body as { username?: string } | null) ?? {};
    log.info({ username }, "resend verification request");
    if (!username) throw new AppError("Username required", 400);
    await resendVerification(username);
    return responseSuccess(res, null, "Verification email sent");
  },
  "resend-verification",
  (req) => ({ username: (req.body as { username?: string })?.username }),
);

// POST /user/login — login, sets the token cookie.
export const loginController = withLogging(
  async (req: Request, res: Response) => {
    const username = (req.body as { username?: string })?.username;
    log.info({ username }, "login request");
    const { user, token } = await login(req.body);
    setAuthCookie(res, token);
    log.info({ userId: user.id }, "login success");
    return responseSuccess(res, user, "Logged in successfully");
  },
  "login",
  (req) => ({ username: (req.body as { username?: string })?.username }),
);

// POST /user/logout — clears the token cookie.
export function logoutController(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  return responseSuccess(res, null, "Logged out");
}

// GET /user/me — current user from the JWT, 401 without one.
export const meController = withLogging(
  async (req: Request, res: Response) => {
    const current = getCurrentUser(req);
    if (!current) throw new AppError("Not authenticated", 401);
    const user = await findUserById(current.id);
    if (!user) throw new AppError("User not found", 401);
    log.debug({ userId: current.id }, "me lookup success");
    return responseSuccess(res, user);
  },
  "me",
  (req) => ({ userId: getCurrentUser(req)?.id }),
);
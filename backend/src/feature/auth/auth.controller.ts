import { type Request, type Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { signToken, verifyToken } from "../../lib/jwt.js";
import type { JwtPayload } from "../../lib/jwt.js";
import {
  responseCreated,
  responseError,
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

// Maps service errors to the envelope error shape. AppError carries its
// own statusCode; anything else is a 500 with a generic message.
function handleError(res: Response, err: unknown) {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  if (statusCode >= 500) {
    return responseError(res, undefined, "Internal server error", 500);
  }
  return responseError(
    res,
    err,
    err instanceof Error ? err.message : "Error",
    statusCode,
  );
}

const log = logger.child({ controller: "auth" });

// POST /user — register. Does NOT set the auth cookie; the user must
// verify their email before logging in (login blocks unverified users).
export async function registerController(req: Request, res: Response) {
  log.info({ username: (req.body as { username?: string })?.username }, "register request");
  try {
    const { user } = await register(req.body);
    log.info({ userId: user.id }, "register success");
    const verificationToken = signToken({ id: user.id, username: user.username }, "24h");
    sendVerificationEmail(user.id, verificationToken).catch(() => {});
    sendWelcomeEmail(user.id, user.username).catch(() => {});
    return responseCreated(res, user, "Registered successfully");
  } catch (err) {
    log.error({ err, username: (req.body as { username?: string })?.username }, "register failed");
    return handleError(res, err);
  }
}

// GET /user/verify-email — verify email via token.
export async function verifyEmailController(req: Request, res: Response) {
  try {
    const token = (req.query.token as string) ?? "";
    if (!token) throw new AppError("Token required", 400);
    await verifyEmail(token);
    return responseSuccess(res, null, "Email verified successfully");
  } catch (err) {
    log.error({ err }, "verify email failed");
    return handleError(res, err);
  }
}

// POST /user/verify-email/resend — resend verification email.
// No auth required — username provided in body.
export async function resendVerificationController(req: Request, res: Response) {
  const { username } = (req.body as { username?: string } | null) ?? {};
  log.info({ username }, "resend verification request");
  try {
    if (!username) throw new AppError("Username required", 400);
    await resendVerification(username);
    return responseSuccess(res, null, "Verification email sent");
  } catch (err) {
    log.error({ err, username }, "resend verification failed");
    return handleError(res, err);
  }
}

// POST /user/login — login, sets the token cookie.
export async function loginController(req: Request, res: Response) {
  const username = (req.body as { username?: string })?.username;
  log.info({ username }, "login request");
  try {
    const { user, token } = await login(req.body);
    setAuthCookie(res, token);
    log.info({ userId: user.id }, "login success");
    return responseSuccess(res, user, "Logged in successfully");
  } catch (err) {
    log.warn({ err, username }, "login failed");
    return handleError(res, err);
  }
}

// POST /user/logout — clears the token cookie.
export function logoutController(_req: Request, res: Response) {
  res.clearCookie("token", { path: "/" });
  return responseSuccess(res, null, "Logged out");
}

// GET /user/me — current user from the JWT, 401 without one.
export async function meController(req: Request, res: Response) {
  try {
    const current = getCurrentUser(req);
    if (!current) throw new AppError("Not authenticated", 401);
    const user = await findUserById(current.id);
    if (!user) throw new AppError("User not found", 401);
    log.debug({ userId: current.id }, "me lookup success");
    return responseSuccess(res, user);
  } catch (err) {
    log.error({ err }, "me lookup failed");
    return handleError(res, err);
  }
}

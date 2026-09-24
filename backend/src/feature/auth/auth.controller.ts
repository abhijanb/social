import { type Request, type Response } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
import { validateOrThrow } from "../../lib/validate.js";
import { userIdParamSchema } from "../user/user.schema.js";
import {
  authTokenExpiryMs,
  signVerifyToken,
  verifyAuthToken,
} from "../../lib/jwt.js";
import type { JwtPayload } from "../../lib/jwt.js";
import {
  responseCreated,
  responseSuccess,
} from "../../lib/response.js";
import {
  findUserById,
  listSessions,
  login,
  logout,
  logoutAll,
  register,
  resendVerification,
  revokeSession,
  verifyEmail,
} from "./auth.service.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { disconnectSessionSockets } from "../../socket/socket.js";
import { sendWelcomeVerificationEmail } from "../notification/mailNotification.js";

function getCurrentUser(req: Request): JwtPayload | null {
  const token =
    (req.cookies as Record<string, string> | undefined)?.token ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload?.id || !payload?.username) return null;
  return payload;
}

const authCookieAttrs = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    ...authCookieAttrs,
    maxAge: authTokenExpiryMs(),
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie("token", { ...authCookieAttrs });
}

function getRequestMeta(req: Request): { userAgent?: string; ip?: string } {
  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"]
      : undefined;
  return { userAgent, ip: req.ip };
}

const log = logger.child({ controller: "auth" });

// POST /user — register. Does NOT set the auth cookie; the user must
// verify their email before logging in (login blocks unverified users).
export const registerController = withLogging(
  async (req: Request, res: Response) => {
    log.info({ username: (req.body as { username?: string })?.username }, "register request");
    const { user } = await register(req.body);
    log.info({ userId: user.id }, "register success");
    const verificationToken = signVerifyToken({ id: user.id, username: user.username });
    try {
      await sendWelcomeVerificationEmail(user.id, user.username, verificationToken);
    } catch (err) {
      log.warn({ err, userId: user.id }, "welcome verification email failed");
      return responseCreated(
        res,
        user,
        "Registered, but the verification email could not be sent. Try resending it.",
      );
    }
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

// POST /user/login — login, creates a Session row and sets the token cookie.
export const loginController = withLogging(
  async (req: Request, res: Response) => {
    const username = (req.body as { username?: string })?.username;
    log.info({ username }, "login request");
    const { user, token } = await login(req.body, getRequestMeta(req));
    setAuthCookie(res, token);
    log.info({ userId: user.id }, "login success");
    return responseSuccess(res, user, "Logged in successfully");
  },
  "login",
  (req) => ({ username: (req.body as { username?: string })?.username }),
);

// POST /user/logout — revokes the current session and clears the cookie.
// Idempotent: missing/invalid tokens still clear the cookie.
export const logoutController = withLogging(
  async (req: Request, res: Response) => {
    const token =
      (req.cookies as Record<string, string> | undefined)?.token ?? null;
    const payload = token ? verifyAuthToken(token) : null;
    await logout(token);
    // Push-kill this session's sockets so revocation is instant —
    // the cookie clear alone leaves live sockets connected.
    if (payload?.jti) disconnectSessionSockets(payload.jti);
    clearAuthCookie(res);
    return responseSuccess(res, null, "Logged out");
  },
  "logout",
);

// POST /user/logout-all — revokes every session except the current one.
export const logoutAllController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user?.jti) throw new AppError("Not authenticated", 401);
    const result = await logoutAll(user.id, user.jti);
    for (const id of result.ids) disconnectSessionSockets(id);
    return responseSuccess(res, result, "Logged out of all other devices");
  },
  "logout-all",
);

// GET /user/sessions — lists the caller's own sessions, current first-flagged.
export const listSessionsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user?.jti) throw new AppError("Not authenticated", 401);
    const sessions = await listSessions(user.id, user.jti);
    return responseSuccess(res, sessions);
  },
  "list-sessions",
);

// DELETE /user/sessions/:id — revokes one owned session (not the current).
export const revokeSessionController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const user = req.user;
    if (!user?.jti) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(userIdParamSchema, req.params);
    await revokeSession(user.id, id, user.jti);
    disconnectSessionSockets(id);
    return responseSuccess(res, null, "Session revoked");
  },
  "revoke-session",
);

// GET /user/me — current user from the session-checked JWT, 401 without one.
// Route runs behind requireAuth, so req.user is already verified live.
export const meController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const current = req.user ?? getCurrentUser(req);
    if (!current) throw new AppError("Not authenticated", 401);
    const user = await findUserById(current.id);
    if (!user) throw new AppError("User not found", 401);
    log.debug({ userId: current.id }, "me lookup success");
    return responseSuccess(res, user);
  },
  "me",
  (req: AuthRequest) => ({ userId: req.user?.id ?? getCurrentUser(req)?.id }),
);
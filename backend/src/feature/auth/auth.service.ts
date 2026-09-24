import * as bcrypt from "bcrypt";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import {
  authTokenExpiryDate,
  signAuthToken,
  signVerifyToken,
  verifyAuthToken,
  verifyVerifyToken,
} from "../../lib/jwt.js";
import { sendVerificationEmail } from "../notification/mailNotification.js";
import { prisma } from "../../lib/prisma.js";
import { stripPassword } from "../../lib/stripPassword.js";
import { validateOrThrow } from "../../lib/validate.js";
import { authSchema, registerSchema } from "./auth.schema.js";

const log = logger.child({ service: "auth" });

// Suggests available usernames by appending numbers (alex -> alex1, ...).
// Port of UserService.suggestUsernames — the IB-highlight conflict UX:
// one DB query checks all candidates, returns up to `count` free names.
export async function suggestUsernames(
  base: string,
  count = 3,
): Promise<string[]> {
  const sanitized = base.trim().slice(0, 20);
  if (!sanitized) return [];
  const candidates: string[] = [];
  for (let i = 1; candidates.length < count * 10 && i <= 1000; i++) {
    const s = String(i);
    const name = `${sanitized.slice(0, 20 - s.length)}${s}`;
    if (name.length >= 3) candidates.push(name);
  }
  const existing = await prisma.user.findMany({
    where: { username: { in: candidates } },
    select: { username: true },
  });
  const taken = new Set(existing.map((u) => u.username));
  return candidates.filter((c) => !taken.has(c)).slice(0, count);
}

// Port of UserService.register — validates input, 409 + suggestions when
// taken, otherwise creates the user (bcrypt-hashed password, email stored).
// No session is created here: the user must verify their email and log in.
export async function register(input: unknown) {
  const dto = validateOrThrow(registerSchema, input);
  log.debug({ username: dto.username }, "register attempt");
  const exists = await prisma.user.findUnique({
    where: { username: dto.username },
  });
  if (exists) {
    log.warn({ username: dto.username }, "register conflict: username taken");
    throw Object.assign(
      new AppError(`Username "${dto.username}" is already taken`, 409),
      {
        suggestions: await suggestUsernames(dto.username),
      },
    );
  }
  const user = await prisma.user.create({
    data: {
      username: dto.username,
      email: dto.email,
      emailVerified: false,
      password: await bcrypt.hash(dto.password, 10),
    },
  });
  log.info({ userId: user.id, username: user.username }, "user created");
  return { user: stripPassword(user) };
}

// Port of UserService.login — validates input, 401 on unknown user or
// wrong password. Creates a Session row and binds its id as the JWT jti
// so the session can be revoked per device or all at once.
export async function login(
  input: unknown,
  meta?: { userAgent?: string; ip?: string },
) {
  const dto = validateOrThrow(authSchema, input);
  log.debug({ username: dto.username }, "login attempt");
  const user = await prisma.user.findUnique({
    where: { username: dto.username },
  });
  if (!user || !(await bcrypt.compare(dto.password, user.password))) {
    log.warn({ username: dto.username }, "login failed: invalid credentials");
    throw new AppError("Invalid credentials", 401);
  }
  if (!user.emailVerified) {
    log.warn({ userId: user.id, username: user.username }, "login failed: email not verified");
    throw new AppError("Email not verified", 403);
  }
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: meta?.userAgent?.slice(0, 300) || undefined,
      ip: meta?.ip?.slice(0, 100) || undefined,
      expiresAt: authTokenExpiryDate(),
    },
    select: { id: true },
  });
  log.info({ userId: user.id, username: user.username }, "login success");
  return {
    user: stripPassword(user),
    token: signAuthToken({ id: user.id, username: user.username, jti: session.id }),
    sessionId: session.id,
  };
}

// Revokes the session bound to the given auth token (idempotent —
// unknown/expired tokens still clear the cookie via the controller).
export async function logout(token: string | null | undefined) {
  if (!token) return { success: true };
  const payload = verifyAuthToken(token);
  if (!payload?.jti) return { success: true };
  await prisma.session.updateMany({
    where: { id: payload.jti, userId: payload.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  log.info({ userId: payload.id, sessionId: payload.jti }, "logout success");
  return { success: true };
}

// Revokes every session except the current one — "logout of all devices"
// keeps the caller logged in. Returns the revoked count.
export async function logoutAll(userId: string, currentJti: string) {
  const result = await prisma.session.updateMany({
    where: { userId, revokedAt: null, id: { not: currentJti } },
    data: { revokedAt: new Date() },
  });
  log.info({ userId }, "logout-all success");
  return { success: true, revoked: result.count };
}

export type SessionListItem = {
  id: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  ip: string | null;
  current: boolean;
};

// Lists the caller's own sessions, newest first, flagged with `current`.
export async function listSessions(
  userId: string,
  currentJti: string,
): Promise<SessionListItem[]> {
  const rows = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      revokedAt: true,
      userAgent: true,
      ip: true,
    },
  });
  return rows.map((row) => ({ ...row, current: row.id === currentJti }));
}

// Revokes one owned session. Missing/foreign ids answer 404 (no oracle);
// revoking the current session via this route is rejected so the Settings
// card cannot self-lock without going through logout.
export async function revokeSession(
  userId: string,
  sessionId: string,
  currentJti: string,
) {
  if (!sessionId) throw new AppError("Session not found", 404);
  if (sessionId === currentJti)
    throw new AppError("Use logout for the current session", 400);
  const row = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, revokedAt: true },
  });
  if (!row) throw new AppError("Session not found", 404);
  if (row.revokedAt) return { success: true };
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
  log.info({ userId, sessionId }, "session revoked");
  return { success: true };
}

// Verify email via token — accepts only verify-purpose tokens, so a
// session token can never verify an email and vice versa.
export async function verifyEmail(token: string) {
  const payload = verifyVerifyToken(token);
  if (!payload?.id) throw new AppError("Invalid or expired token", 400);
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) throw new AppError("User not found", 404);
  if (user.emailVerified) throw new AppError("Email already verified", 400);
  await prisma.user.update({
    where: { id: payload.id },
    data: { emailVerified: true },
  });
  log.info({ userId: user.id }, "email verified");
  return { success: true };
}

// Resend verification email — generates a fresh 24h token.
// No auth required — caller identifies user by username.
export async function resendVerification(username: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new AppError("User not found", 404);
  if (user.emailVerified) throw new AppError("Email already verified", 400);
  const token = signVerifyToken({ id: user.id, username: user.username });
  sendVerificationEmail(user.id, token).catch((err) =>
      log.warn({ err, userId: user.id }, "verification email failed"),
    );
  log.info({ userId: user.id, username: user.username }, "verification email resent");
  return { success: true };
}

// Port of UserService.findOne — used by GET /user/me. Returns null when
// the JWT belongs to a deleted user so the route can answer 401.
export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return stripPassword(user);
}

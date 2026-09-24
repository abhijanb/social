import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errorHandler.js";
import { verifyAuthToken } from "../lib/jwt.js";
import type { JwtPayload } from "../lib/jwt.js";
import { getLiveSession, touchSessionIfStale } from "../lib/sessions.js";

// Request with the verified JWT payload attached (when present).
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

async function readUser(req: Request): Promise<JwtPayload | null> {
  const token =
    (req.cookies as Record<string, string> | undefined)?.token ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload?.id || !payload?.username || !payload?.jti) return null;
  const session = await getLiveSession(payload.jti, payload.id);
  if (!session) return null;
  await touchSessionIfStale(payload.jti, session.lastSeenAt);
  return payload;
}

// Attaches req.user when a valid token + live session is present, never rejects.
// For endpoints that work anonymously but personalize when logged in
// (e.g. GET /user?search=).
export async function attachUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  req.user = (await readUser(req)) ?? undefined;
  next();
}

// Requires a valid token + live session — 401 otherwise. Controllers behind
// this can rely on req.user being set (with a defensive check for the types).
export async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await readUser(req);
  if (!user) throw new AppError("Not authenticated", 401);
  req.user = user;
  next();
}

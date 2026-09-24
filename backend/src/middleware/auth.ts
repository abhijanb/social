import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errorHandler.js";
import { verifyAuthToken } from "../lib/jwt.js";
import type { JwtPayload } from "../lib/jwt.js";

// Request with the verified JWT payload attached (when present).
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

function readUser(req: Request): JwtPayload | null {
  const token =
    (req.cookies as Record<string, string> | undefined)?.token ??
    req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const payload = verifyAuthToken(token);
  if (!payload?.id || !payload?.username) return null;
  return payload;
}

// Attaches req.user when a valid token is present, never rejects.
// For endpoints that work anonymously but personalize when logged in
// (e.g. GET /user?search=).
export function attachUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  req.user = readUser(req) ?? undefined;
  next();
}

// Requires a valid token — 401 otherwise. Controllers behind this can
// rely on req.user being set (with a defensive check for the types).
export function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const user = readUser(req);
  if (!user) throw new AppError("Not authenticated", 401);
  req.user = user;
  next();
}

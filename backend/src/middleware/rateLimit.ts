import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";
import type { AuthRequest } from "./auth.js";
import { responseError } from "../lib/response.js";

// Key by JWT user when authed (fair per-account behind NAT), else by IP
// with the IPv6-safe helper (required by express-rate-limit validation).
function keyByUserOrIp(req: Request): string {
  const user = (req as AuthRequest).user;
  if (user?.id) return `user:${user.id}`;
  return ipKeyGenerator(req.ip ?? "unknown");
}

function tooManyHandler(windowMs: number) {
  return (_req: Request, res: Response): void => {
    res.setHeader("Retry-After", String(Math.ceil(windowMs / 1000)));
    responseError(res, undefined, "Too many requests, slow down", 429);
  };
}

function makeLimiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: keyByUserOrIp,
    handler: tooManyHandler(windowMs),
  });
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// Global safety net — generous, per IP (runs before auth, no user yet).
export const globalLimiter = rateLimit({
  windowMs: 15 * MIN,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: tooManyHandler(15 * MIN),
});

// Brute-force / cost protection: bcrypt + welcome emails are expensive.
export const authLimiter = rateLimit({
  windowMs: 15 * MIN,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  handler: tooManyHandler(15 * MIN),
});

// Live search as-you-type (debounced) — generous per account.
export const searchLimiter = makeLimiter(MIN, 60);

// Writes / anti-spam: chat + comments + friend requests + stream starts.
export const sendLimiter = makeLimiter(MIN, 30);

// Rapid taps: likes + saves + story views (optimistic UI reverts on 429).
export const interactLimiter = makeLimiter(MIN, 60);

// Heavy multipart writes — limiter runs before multer so rejected
// uploads never touch disk.
export const uploadLimiter = makeLimiter(HOUR, 20);

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Secrets/expiry come from validated env — env.ts fails fast at boot
// if JWT_SECRET is missing or too short.
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export type JwtPurpose = "auth" | "verify";

export type JwtPayload = { id: string; username: string; purpose: JwtPurpose; jti?: string };

type AuthTokenInput = { id: string; username: string; jti: string };
type VerifyTokenInput = { id: string; username: string };

function signPayload(
  payload: JwtPayload,
  expiresIn: string,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

// Session token — issued on login with the Session row id as jti.
// Accepted by auth middleware, controllers, and sockets only when the
// matching Session row exists and is neither revoked nor expired.
// Rejects verify-purpose and legacy jti-less tokens.
export function signAuthToken(input: AuthTokenInput): string {
  return signPayload({ ...input, purpose: "auth" }, JWT_EXPIRES_IN);
}

// Email-verification token — 24h, accepted only by verifyEmail.
// Never valid as a session, so an unverified user cannot use the
// verification link to access protected routes or sockets.
export function signVerifyToken(input: VerifyTokenInput): string {
  return signPayload({ ...input, purpose: "verify" }, "24h");
}

function verifyWithPurpose(
  token: string,
  requiredPurpose: JwtPurpose,
): JwtPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Partial<JwtPayload>;
    if (payload?.purpose !== requiredPurpose) return null;
    if (!payload?.id || !payload?.username) return null;
    if (requiredPurpose === "auth" && !payload?.jti) return null;
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyAuthToken(token: string): JwtPayload | null {
  return verifyWithPurpose(token, "auth");
}

// Session/cookie lifetime derived from JWT_EXPIRES_IN (e.g. "7d", "24h").
// Single source of truth so the Session row and the cookie expire together.
export function authTokenExpiryMs(): number {
  const raw = JWT_EXPIRES_IN.trim();
  const match = /^(\d+)\s*([smhd])?$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2] ?? "s";
  const factor =
    unit === "s" ? 1000
    : unit === "m" ? 60 * 1000
    : unit === "h" ? 60 * 60 * 1000
    : 24 * 60 * 60 * 1000;
  return value * factor;
}

export function authTokenExpiryDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + authTokenExpiryMs());
}

export function verifyVerifyToken(token: string): JwtPayload | null {
  return verifyWithPurpose(token, "verify");
}

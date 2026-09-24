import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Secrets/expiry come from validated env — env.ts fails fast at boot
// if JWT_SECRET is missing or too short.
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export type JwtPurpose = "auth" | "verify";

export type JwtPayload = { id: string; username: string; purpose: JwtPurpose };

type AuthTokenInput = { id: string; username: string };
type VerifyTokenInput = { id: string; username: string };

function signPayload(
  payload: JwtPayload,
  expiresIn: string,
): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  } as jwt.SignOptions);
}

// Session token — issued on login (and register response), accepted by
// auth middleware, controllers, and sockets. Rejects verify-purpose and
// legacy purpose-less tokens.
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
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyAuthToken(token: string): JwtPayload | null {
  return verifyWithPurpose(token, "auth");
}

export function verifyVerifyToken(token: string): JwtPayload | null {
  return verifyWithPurpose(token, "verify");
}

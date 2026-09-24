import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// Secrets/expiry come from validated env — env.ts fails fast at boot
// if JWT_SECRET is missing or too short.
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

export type JwtPayload = { id: string; username: string };

export function signToken(payload: JwtPayload, expiresIn?: string): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn ?? JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

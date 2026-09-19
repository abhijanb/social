import jwt from "jsonwebtoken";

// Port of back/src/lib/jwt.ts — same secret/expiry contract so tokens
// issued by either backend verify on the other during the migration.
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

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

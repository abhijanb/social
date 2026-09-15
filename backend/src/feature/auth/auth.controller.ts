import type { Request, Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { verifyToken } from "../../lib/jwt.js";
import type { JwtPayload } from "../../lib/jwt.js";
import {
  responseCreated,
  responseError,
  responseSuccess,
} from "../../lib/response.js";
import { findUserById, login, register } from "./auth.service.js";

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
    console.error(err);
    return responseError(res, undefined, "Internal server error", 500);
  }
  return responseError(
    res,
    err,
    err instanceof Error ? err.message : "Error",
    statusCode,
  );
}

// POST /user — register, sets the token cookie.
export async function registerController(req: Request, res: Response) {
  try {
    const { user, token } = await register(req.body);
    setAuthCookie(res, token);
    return responseCreated(res, user, "Registered successfully");
  } catch (err) {
    return handleError(res, err);
  }
}

// POST /user/login — login, sets the token cookie.
export async function loginController(req: Request, res: Response) {
  try {
    const { user, token } = await login(req.body);
    setAuthCookie(res, token);
    return responseSuccess(res, user, "Logged in successfully");
  } catch (err) {
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
    return responseSuccess(res, user);
  } catch (err) {
    return handleError(res, err);
  }
}

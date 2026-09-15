import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errorHandler.js";
import { responseError } from "../lib/response.js";

// Final error middleware — replaces every per-controller handleError.
// AppError carries its own statusCode; anything else is a 500 with a
// generic message (no internals leak). Must be registered after all
// routers in index.ts. Express 5 forwards async throws here automatically.
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    console.error(err);
    return;
  }
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  if (statusCode >= 500) {
    console.error(err);
    responseError(res, undefined, "Internal server error", 500);
    return;
  }
  responseError(
    res,
    err,
    err instanceof Error ? err.message : "Error",
    statusCode,
  );
}

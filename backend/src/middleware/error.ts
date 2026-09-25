import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { isClientClosed } from "../lib/clientClosed.js";
import { logger } from "../lib/logger.js";
import { responseError } from "../lib/response.js";

const log = logger.child({ middleware: "error" });

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Frontend already went away (aborted search, unmount) — nobody listens,
  // so don't try to write a response or log it as a failure.
  if (res.headersSent || isClientClosed(req, res)) {
    return;
  }
  const isHttp = createHttpError.isHttpError(err);
  const statusCode = isHttp ? err.statusCode : 500;
  const details = { err, path: req.path, method: req.method, ip: req.ip, statusCode };
  // Expected client errors (pre-login polls, stale sessions, 404s) are not
  // service failures — keep them out of ERROR so real 5xx stand out.
  if (statusCode >= 500) {
    log.error(details, "unhandled error");
  } else if (statusCode === 401 || statusCode === 404) {
    log.debug(details, "client error");
  } else {
    log.warn(details, "client error");
  }
  if (statusCode >= 500) {
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
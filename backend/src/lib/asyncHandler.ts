import { type Request, type Response, type NextFunction } from "express";
import createHttpError from "http-errors";
import { isClientClosed } from "./clientClosed.js";
import { logger } from "./logger.js";

type AsyncHandler<T extends Request = Request> = (
  req: T,
  res: Response,
  next: NextFunction,
) => Promise<Response | void>;

export function withLogging<T extends Request = Request>(
  handler: AsyncHandler<T>,
  context: string,
  logContext?: (req: T) => Record<string, unknown>,
): AsyncHandler<T> {
  const log = logger.child({ handler: context });
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      const extra = logContext ? logContext(req) : {};
      // Aborted by frontend (next keystroke, unmount) — not a real failure.
      if (isClientClosed(req, res)) {
        log.debug({ err, ...extra }, `${context} aborted by client`);
      } else if (
        createHttpError.isHttpError(err) &&
        err.statusCode < 500
      ) {
        // Expected client errors (401 pre-login polls, 404s, 400 validation)
        // bubble to errorMiddleware which logs them once at warn/debug.
        log.debug({ err, ...extra }, `${context} client error`);
      } else {
        log.error({ err, ...extra }, `${context} failed`);
      }
      throw err;
    }
  };
}

export function withCleanup<T extends Request = Request>(
  handler: AsyncHandler<T>,
  context: string,
  logContext?: (req: T) => Record<string, unknown>,
  cleanup?: (req: T) => Promise<void>,
): AsyncHandler<T> {
  const log = logger.child({ handler: context });
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      const extra = logContext ? logContext(req) : {};
      if (isClientClosed(req, res)) {
        log.debug({ err, ...extra }, `${context} aborted by client`);
      } else if (
        createHttpError.isHttpError(err) &&
        err.statusCode < 500
      ) {
        log.debug({ err, ...extra }, `${context} client error`);
      } else {
        log.error({ err, ...extra }, `${context} failed`);
      }
      if (cleanup) await cleanup(req);
      throw err;
    }
  };
}

import { type Request, type Response, type NextFunction } from "express";
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
      log.error({ err, ...extra }, `${context} failed`);
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
      log.error({ err, ...extra }, `${context} failed`);
      if (cleanup) await cleanup(req);
      throw err;
    }
  };
}

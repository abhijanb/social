import createHttpError from "http-errors";

export type ValidationIssue = {
  field: string;
  message: string;
  code: string;
};

// Thin shim over http-errors that preserves the legacy
// `new AppError(message, statusCode)` call sites (~100 across the
// codebase). It produces a real HttpError — correct expose flags,
// status, and named constructors — so the error middleware recognizes
// it via createHttpError.isHttpError instead of a custom instanceof.
interface AppErrorConstructor {
  new (message: string, statusCode?: number): createHttpError.HttpError;
  (message: string, statusCode?: number): createHttpError.HttpError;
}

export const AppError: AppErrorConstructor = function (
  message: string,
  statusCode = 500,
) {
  const err = createHttpError(statusCode, message);
  err.name = "AppError";
  return err;
} as unknown as AppErrorConstructor;

export function uniqueConflictTarget(error: unknown): string[] {
  const meta = (
    error as { meta?: Record<string, unknown> } | null
  )?.meta;
  if (!meta || typeof meta !== "object") return [];
  if (Array.isArray(meta.target)) return meta.target.map(String);
  const cause = (
    meta.driverAdapterError as { cause?: unknown } | undefined
  )?.cause as
    | { constraint?: { index?: unknown; fields?: unknown }; fields?: unknown }
    | undefined;
  const constraint = cause?.constraint;
  if (typeof constraint?.index === "string") return [constraint.index];
  if (Array.isArray(constraint?.fields)) return constraint.fields.map(String);
  if (Array.isArray(cause?.fields)) return cause.fields.map(String);
  return [];
}

// ValidationError wraps zod issues — a 400 HttpError carrying the
// formatted issues so the envelope serializes them as { message, errors }.
export function ValidationError(
  errors: ValidationIssue[],
): createHttpError.HttpError<400> {
  const err = createHttpError(400, "Validation failed");
  err.name = "ValidationError";
  (err as unknown as { errors: ValidationIssue[] }).errors = errors;
  return err;
}
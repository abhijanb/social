export type ValidationIssue = {
  field: string;
  message: string;
  code: string;
};

// Base service error: message + HTTP status code. Routes let these bubble
// to sendError, which maps them to responses. Default 500 for unexpected
// failures (sendError answers those generically, same as Nest).
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

// Thrown by validateOrThrow when a zod schema rejects the payload.
// Carries the formatted issues as an own enumerable prop, so sendError
// serializes it as 400 { message, errors } with no extra work.
export class ValidationError extends AppError {
  readonly errors: ValidationIssue[];

  constructor(errors: ValidationIssue[]) {
    super("Validation failed", 400);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

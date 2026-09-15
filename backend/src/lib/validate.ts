import { z } from "zod";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "./errorHandler.js";
import type { ValidationIssue } from "./errorHandler.js";

// Validates data against a zod schema or throws ValidationError (400).
// Single validation path for all routes: parse input with this inside
// try/catch and let sendError map the failure to the response.
export function validateOrThrow<T extends ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(formatZodErrors(result.error.issues));
  }
  return result.data;
}

function formatZodErrors(
  issues: ReadonlyArray<{
    path: ReadonlyArray<PropertyKey>;
    message: string;
    code: string;
  }>,
): ValidationIssue[] {
  return issues.map((issue) => ({
    field: issue.path.length ? issue.path.map(String).join(".") : "root",
    message: issue.message,
    code: issue.code,
  }));
}

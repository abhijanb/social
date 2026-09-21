import pino from "pino";

export const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

// Creates a module-scoped child logger so call sites don't repeat the
// same context object on every log call.
// Usage: const log = createChildLogger({ controller: "auth" });
export function createChildLogger(
  bindings: Record<string, unknown>,
): pino.Logger {
  return logger.child(bindings);
}
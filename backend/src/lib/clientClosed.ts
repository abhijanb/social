import type { Request, Response } from "express";

// True when the frontend's connection is already dead (tab/app closed
// mid-search). Cooperative cancel only — Prisma has no AbortSignal, so
// callers check between sequential DB trips and skip responses nobody
// listens to.
//
// ONLY connection-level signals are used here. req.closed / req.destroyed
// flip true once Express consumes the request body, so they MUST NOT be
// treated as aborts — doing so swallows healthy POST responses in
// errorMiddleware and hangs the client.
export function isClientClosed(req: Request, res?: Response): boolean {
  if (req.socket?.destroyed) return true;
  if (res) {
    const w = res as Response & { destroyed?: boolean };
    if (w.destroyed && !w.writableEnded) return true;
  }
  return false;
}

import type { Request, Response } from "express";

// True when the frontend already aborted the HTTP request (typing
// "a" -> "al" cancels request #1, tab closed mid-search, friend/room
// switch unmounts the RTK Query hook). Prisma can't take an AbortSignal,
// so callers use this cooperatively: check between sequential DB trips
// and skip sending a response nobody listens to.
export function isClientClosed(req: Request, res?: Response): boolean {
  const r = req as Request & {
    aborted?: boolean;
    closed?: boolean;
    destroyed?: boolean;
  };
  if (r.aborted) return true;
  if (r.closed) return true;
  if (r.destroyed) return true;
  if (req.socket?.destroyed) return true;
  if (res) {
    const w = res as Response & { destroyed?: boolean; closed?: boolean };
    if (w.destroyed && !w.writableEnded) return true;
    if (w.closed && !w.writableEnded) return true;
  }
  return false;
}

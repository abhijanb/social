import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { getPresenceForIds } from "./presence.service.js";
import { presenceQuerySchema } from "./presence.schema.js";

const log = logger.child({ controller: "presence" });

// GET /presence?ids= — online status for up to 50 ids.
// Port of PresenceController.getPresence: no ids → [], ids without
// auth → 401 (route uses attachUser, not requireAuth, to keep that).
export async function getPresenceController(req: AuthRequest, res: Response) {
  const { ids } = validateOrThrow(presenceQuerySchema, req.query);
  if (!ids) return responseSuccess(res, []);
  if (!req.user) throw new AppError("Not authenticated", 401);
  const list = ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  log.debug({ userId: req.user?.id, count: list.length }, "presence lookup");
  return responseSuccess(res, getPresenceForIds(list));
}

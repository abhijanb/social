import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { getFriendIds } from "../../lib/friends.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
import { responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { getPresenceForIds } from "./presence.service.js";
import { presenceQuerySchema } from "./presence.schema.js";

const log = logger.child({ controller: "presence" });

// GET /presence?ids= — online status for up to 50 ids.
// Friends-only: ids are filtered to self + ACCEPTED friends, the rest
// silently dropped (a batch must not fail 49 good ids for 1 stale id,
// and even lastSeen timestamps of strangers must not leak). Anonymous
// callers get [] for empty ids, 401 otherwise.
export const getPresenceController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const { ids } = validateOrThrow(presenceQuerySchema, req.query);
    if (!ids) return responseSuccess(res, []);
    if (!req.user) throw new AppError("Not authenticated", 401);
    const list = ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);
    const allowed = new Set([req.user.id, ...(await getFriendIds(req.user.id))]);
    const scoped = list.filter((id) => allowed.has(id));
    log.debug(
      { userId: req.user?.id, asked: list.length, served: scoped.length },
      "presence lookup",
    );
    return responseSuccess(res, getPresenceForIds(scoped));
  },
  "get-presence",
  (req) => ({
    userId: req.user?.id,
    count: req.query.ids ? (req.query.ids as string).split(",").length : 0,
  }),
);

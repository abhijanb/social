import { Router } from "express";
import { attachUser } from "../../middleware/auth.js";
import { getPresenceController } from "./presence.controller.js";

export const presenceRouter = Router();

// attachUser (not requireAuth): anonymous callers get [] for empty ids,
// but ids without a token must 401 — decided in the controller.
presenceRouter.get("/", attachUser, getPresenceController);

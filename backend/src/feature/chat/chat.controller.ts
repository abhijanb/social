import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import { getHistory, sendMessage } from "./chat.service.js";
import { chatHistoryQuerySchema } from "./chat.schema.js";

// GET /chat/history?friendId=&limit= — last N messages with a friend.
// Port of ChatController.getHistory (behind requireAuth).
export async function getHistoryController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { friendId, limit } = validateOrThrow(
    chatHistoryQuerySchema,
    req.query,
  );
  const n = limit
    ? Math.min(100, Math.max(1, Number(limit) || 50))
    : 50;
  return responseSuccess(res, await getHistory(req.user.id, friendId.trim(), n));
}

// POST /chat/send — REST fallback for sending (socket is primary).
// Port of ChatController.send (behind requireAuth).
export async function sendMessageController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const message = await sendMessage(req.user.id, req.body);
  return responseCreated(res, message, "Message sent");
}

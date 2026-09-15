import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  endStream,
  getComments,
  listLive,
  sendComment,
  startStream,
} from "./livestream.service.js";
import { streamCommentsQuerySchema, streamIdParamSchema } from "./livestream.schema.js";
import { emitStreamEnded } from "./livestream.socket.js";

// POST /livestream/start — go live (one LIVE stream per user).
export async function startStreamController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  return responseCreated(res, await startStream(req.user.id, req.body), "Went live");
}

// POST /livestream/:id/end — host ends their stream. Peers in the
// socket room are notified so they tear down WebRTC connections.
export async function endStreamController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(streamIdParamSchema, req.params);
  const stream = await endStream(req.user.id, id);
  emitStreamEnded(id);
  return responseSuccess(res, stream, "Stream ended");
}

// GET /livestream/live — own + friends' LIVE streams, newest first.
export async function listLiveController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  return responseSuccess(res, await listLive(req.user.id));
}

// GET /livestream/:id/comments?sinceId=&limit= — latest page, or only
// comments newer than the cursor for incremental polling.
export async function getCommentsController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(streamIdParamSchema, req.params);
  const { sinceId, limit } = validateOrThrow(
    streamCommentsQuerySchema,
    req.query,
  );
  return responseSuccess(
    res,
    await getComments(req.user.id, id, sinceId, Number(limit)),
  );
}

// POST /livestream/:id/comments — post a live comment.
export async function sendCommentController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(streamIdParamSchema, req.params);
  return responseCreated(
    res,
    await sendComment(req.user.id, id, req.body),
    "Comment sent",
  );
}

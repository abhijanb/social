import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
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

const log = logger.child({ controller: "livestream" });

// POST /livestream/start — go live (one LIVE stream per user).
export const startStreamController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    log.debug({ userId: req.user.id }, "stream start");
    return responseCreated(res, await startStream(req.user.id, req.body), "Went live");
  },
  "start-stream",
  (req) => ({ userId: req.user?.id }),
);

// POST /livestream/:id/end — host ends their stream. Peers in the
// socket room are notified so they tear down WebRTC connections.
export const endStreamController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(streamIdParamSchema, req.params);
    log.debug({ userId: req.user.id, streamId: id }, "stream end");
    const stream = await endStream(req.user.id, id);
    emitStreamEnded(id);
    return responseSuccess(res, stream, "Stream ended");
  },
  "end-stream",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

// GET /livestream/live — own + friends' LIVE streams, newest first.
export const listLiveController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    log.debug({ userId: req.user.id }, "live list");
    return responseSuccess(res, await listLive(req.user.id));
  },
  "list-live",
  (req) => ({ userId: req.user?.id }),
);

// GET /livestream/:id/comments?sinceId=&limit= — latest page, or only
// comments newer than the cursor for incremental polling.
export const getCommentsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(streamIdParamSchema, req.params);
    const { sinceId, limit } = validateOrThrow(
      streamCommentsQuerySchema,
      req.query,
    );
    log.debug({ userId: req.user.id, streamId: id, sinceId }, "comments fetch");
    return responseSuccess(
      res,
      await getComments(req.user.id, id, sinceId, Number(limit)),
    );
  },
  "stream-comments",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

// POST /livestream/:id/comments — post a live comment.
export const sendCommentController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(streamIdParamSchema, req.params);
    log.debug({ userId: req.user.id, streamId: id }, "comment send");
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    return responseCreated(
      res,
      await sendComment(req.user.id, id, req.body, idempotencyKey),
      "Comment sent",
    );
  },
  "send-comment",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

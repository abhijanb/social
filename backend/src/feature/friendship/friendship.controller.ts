import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  findAllFriendships,
  findFriends,
  findFriendshipById,
  findPending,
} from "./friendship.queries.js";
import {
  acceptFriendship,
  createFriendship,
  removeFriendship,
  updateFriendship,
} from "./friendship.requests.js";
import {
  friendshipIdParamSchema,
  friendshipListQuerySchema,
  friendshipUserQuerySchema,
  createFriendshipSchema,
} from "./friendship.schema.js";

const log = logger.child({ controller: "friendship" });

// POST /friendship — send a friend request. requireAuth; requesterId
// is set from the authenticated user (never trusted from the client).
export const createFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { addresseeId } = validateOrThrow(createFriendshipSchema, req.body);
    log.info({ requesterId: req.user.id, addresseeId }, "friend request");
    const friendship = await createFriendship(req.user.id, {
      addresseeId,
    });
    return responseCreated(res, friendship, "Friend request sent");
  },
  "create-friendship",
  (req) => ({
    requesterId: req.user?.id,
    addresseeId: (req.body as { addresseeId?: string })?.addresseeId,
  }),
);

// GET /friendship?userId= — own accepted friends. userId must be omitted
// or self: any other id is someone else's graph (400), never served.
export const listFriendshipsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { userId } = validateOrThrow(friendshipListQuerySchema, req.query);
    if (userId && userId !== req.user.id) {
      throw new AppError("Can only view own friendships", 400);
    }
    const target = userId || req.user.id;
    log.debug({ requesterId: req.user.id, target }, "friends list");
    return responseSuccess(res, await findFriends(target));
  },
  "list-friends",
  (req) => ({ requesterId: req.user?.id, userId: req.query.userId }),
);

// GET /friendship/pending?userId= — own pending both directions.
// userId must be self: anyone else's pending queue is theirs (400).
export const listPendingController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { userId } = validateOrThrow(friendshipUserQuerySchema, req.query);
    if (userId && userId !== req.user.id) {
      throw new AppError("Can only view own friendships", 400);
    }
    const target = userId || req.user.id;
    log.debug({ requesterId: req.user.id, target }, "pending list");
    return responseSuccess(res, await findPending(target));
  },
  "list-pending",
  (req) => ({ requesterId: req.user?.id, userId: req.query.userId }),
);

// GET /friendship/:id — single row, participant-only (404 otherwise,
// same as missing, so row existence isn't leaked).
export const getFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.debug({ id }, "friendship lookup");
    return responseSuccess(res, await findFriendshipById(id, req.user.id));
  },
  "get-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// PATCH /friendship/:id — status change. Port of FriendshipController.update.
// actorId is the authenticated user (never trusted from the client).
export const updateFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friendship update");
    return responseSuccess(res, await updateFriendship(id, req.body, req.user.id));
  },
  "update-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// PATCH /friendship/:id/accept — addressee accepts. Port of FriendshipController.accept.
// actorId is the authenticated user (never trusted from the client body,
// which this endpoint no longer reads).
export const acceptFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friend accept");
    return responseSuccess(res, await acceptFriendship(id, req.user.id));
  },
  "accept-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// DELETE /friendship/:id — remove, participant-only.
export const deleteFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friend delete");
    await removeFriendship(id, req.user.id);
    return responseSuccess(res, null, "Friendship deleted");
  },
  "delete-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

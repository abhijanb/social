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

// GET /friendship?userId= — accepted friends, or own recent 50 without userId.
// Port of FriendshipController.findAll.
export const listFriendshipsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { userId } = validateOrThrow(friendshipListQuerySchema, req.query);
    const target = userId || req.user.id;
    log.debug({ requesterId: req.user.id, target }, "friends list");
    return responseSuccess(res, await findFriends(target));
  },
  "list-friends",
  (req) => ({ requesterId: req.user?.id, userId: req.query.userId }),
);

// GET /friendship/pending?userId= — pending both directions.
// Port of FriendshipController.findPending.
export const listPendingController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { userId } = validateOrThrow(friendshipUserQuerySchema, req.query);
    const target = userId || req.user.id;
    log.debug({ requesterId: req.user.id, target }, "pending list");
    return responseSuccess(res, await findPending(target));
  },
  "list-pending",
  (req) => ({ requesterId: req.user?.id, userId: req.query.userId }),
);

// GET /friendship/:id — single row. Port of FriendshipController.findOne.
export const getFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.debug({ id }, "friendship lookup");
    return responseSuccess(res, await findFriendshipById(id));
  },
  "get-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// PATCH /friendship/:id — status change. Port of FriendshipController.update.
export const updateFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friendship update");
    return responseSuccess(res, await updateFriendship(id, req.body));
  },
  "update-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// PATCH /friendship/:id/accept — addressee accepts. Port of FriendshipController.accept.
export const acceptFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friend accept");
    return responseSuccess(res, await acceptFriendship(id, req.body));
  },
  "accept-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

// DELETE /friendship/:id — remove. Port of FriendshipController.remove.
export const deleteFriendshipController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "friend delete");
    await removeFriendship(id);
    return responseSuccess(res, null, "Friendship deleted");
  },
  "delete-friendship",
  (req) => ({ requesterId: req.user?.id, id: req.params.id }),
);

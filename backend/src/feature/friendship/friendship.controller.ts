import type { Response } from "express";
import { responseCreated, responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  acceptFriendship,
  createFriendship,
  findAllFriendships,
  findFriends,
  findFriendshipById,
  findPending,
  removeFriendship,
  updateFriendship,
} from "./friendship.service.js";
import {
  friendshipIdParamSchema,
  friendshipListQuerySchema,
  friendshipUserQuerySchema,
} from "./friendship.schema.js";

// POST /friendship — send a friend request. Port of FriendshipController.create.
export async function createFriendshipController(
  req: AuthRequest,
  res: Response,
) {
  const friendship = await createFriendship(req.body);
  return responseCreated(res, friendship, "Friend request sent");
}

// GET /friendship?userId= — accepted friends, or recent 50 without userId.
// Port of FriendshipController.findAll.
export async function listFriendshipsController(
  req: AuthRequest,
  res: Response,
) {
  const { userId } = validateOrThrow(friendshipListQuerySchema, req.query);
  if (userId) {
    return responseSuccess(res, await findFriends(userId));
  }
  return responseSuccess(res, await findAllFriendships());
}

// GET /friendship/pending?userId= — pending both directions.
// Port of FriendshipController.findPending.
export async function listPendingController(req: AuthRequest, res: Response) {
  const { userId } = validateOrThrow(friendshipUserQuerySchema, req.query);
  return responseSuccess(res, await findPending(userId));
}

// GET /friendship/:id — single row. Port of FriendshipController.findOne.
export async function getFriendshipController(req: AuthRequest, res: Response) {
  const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
  return responseSuccess(res, await findFriendshipById(id));
}

// PATCH /friendship/:id — status change. Port of FriendshipController.update.
export async function updateFriendshipController(
  req: AuthRequest,
  res: Response,
) {
  const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
  return responseSuccess(res, await updateFriendship(id, req.body));
}

// PATCH /friendship/:id/accept — addressee accepts. Port of FriendshipController.accept.
export async function acceptFriendshipController(
  req: AuthRequest,
  res: Response,
) {
  const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
  return responseSuccess(res, await acceptFriendship(id, req.body));
}

// DELETE /friendship/:id — remove. Port of FriendshipController.remove.
export async function deleteFriendshipController(
  req: AuthRequest,
  res: Response,
) {
  const { id } = validateOrThrow(friendshipIdParamSchema, req.params);
  await removeFriendship(id);
  return responseSuccess(res, null, "Friendship deleted");
}

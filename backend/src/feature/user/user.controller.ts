import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  findAll,
  findUserById,
  removeUser,
  updateUser,
} from "./user.service.js";
import { userIdParamSchema, userSearchSchema } from "./user.schema.js";

// GET /user?search= — live search (auth required when searching) or
// recent-users list. Port of UserController.findAll. Errors bubble to
// the shared errorMiddleware.
export async function listUsersController(req: AuthRequest, res: Response) {
  const { search } = validateOrThrow(userSearchSchema, req.query);
  const trimmed = search.trim();
  // Strict for search: must be authenticated to get self-excluded results.
  if (trimmed && !req.user) throw new AppError("Not authenticated", 401);
  const users = await findAll(trimmed, req.user?.id);
  return responseSuccess(res, users);
}

// GET /user/:id — single profile. Port of UserController.findOne.
export async function getUserController(req: AuthRequest, res: Response) {
  const { id } = validateOrThrow(userIdParamSchema, req.params);
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404);
  return responseSuccess(res, user);
}

// PATCH /user/me — update own profile (behind requireAuth).
// Port of UserController.update.
export async function updateMeController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const user = await updateUser(req.user.id, req.body);
  return responseSuccess(res, user);
}

// DELETE /user/:id — delete a user. Port of UserController.remove.
// Only self-deletion is allowed.
export async function deleteUserController(req: AuthRequest, res: Response) {
  const { id } = validateOrThrow(userIdParamSchema, req.params);
  if (req.user?.id !== id) throw new AppError("Cannot delete other users", 403);
  await removeUser(id);
  return responseSuccess(res, null, "User deleted");
}

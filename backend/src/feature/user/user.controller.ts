import type { Response } from "express";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import { responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  findAll,
  findUserById,
  getProfile,
  removeUser,
  updateUser,
} from "./user.service.js";
import {
  userIdParamSchema,
  userSearchSchema,
  usernameParamSchema,
} from "./user.schema.js";

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

// GET /user/by-username/:username — Instagram-style canonical lookup.
export async function getUserByUsernameController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { username } = validateOrThrow(usernameParamSchema, req.params);
  return responseSuccess(res, await getProfile(req.user.id, username));
}

// PATCH /user/me — update own profile (behind requireAuth).
// Accepts JSON (bio/displayName/username/password/isPublic/removeAvatar)
// or multipart with an "avatar" image file + the same text fields.
// Multipart text fields arrive as strings, so "true"/"false" are coerced
// for booleans before validation. Uploaded file wins over removeAvatar.
// Old avatar files are unlinked on replace/clear; new files are unlinked
// if the DB update fails (no orphans) — same contract as stories/posts.
export async function updateMeController(req: AuthRequest, res: Response) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
  const body: Record<string, unknown> = { ...(req.body as Record<string, unknown>) };
  // Coerce multipart string booleans ("true"/"false") to real booleans.
  for (const key of ["isPublic", "removeAvatar"] as const) {
    const v = body[key];
    if (typeof v === "string") {
      if (v === "true") body[key] = true;
      else if (v === "false") body[key] = false;
    }
  }
  // Never trust client-set avatarUrl — avatars only change via file upload
  // or removeAvatar.
  delete body.avatarUrl;

  const newAvatarUrl = file ? `/uploads/${file.filename}` : undefined;
  const unlinkNew = () =>
    file ? unlink(join(process.cwd(), "uploads", file.filename)).catch(() => {}) : Promise.resolve();

  // Snapshot the old avatar so it can be cleaned up after replace/clear.
  const current = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatarUrl: true },
  });
  if (!current) {
    await unlinkNew();
    throw new AppError("User not found", 404);
  }

  try {
    const user = await updateUser(
      req.user.id,
      body,
      newAvatarUrl !== undefined
        ? { avatarUrl: newAvatarUrl }
        : body.removeAvatar === true
          ? { avatarUrl: null }
          : {},
    );
    const oldUrl = current.avatarUrl;
    const changed =
      newAvatarUrl !== undefined || body.removeAvatar === true;
    if (changed && oldUrl && oldUrl.startsWith("/uploads/") && oldUrl !== newAvatarUrl) {
      await unlink(join(process.cwd(), oldUrl.slice(1))).catch(() => {});
    }
    return responseSuccess(res, user);
  } catch (err) {
    await unlinkNew();
    throw err;
  }
}

// DELETE /user/:id — delete a user. Port of UserController.remove.
// Only self-deletion is allowed.
export async function deleteUserController(req: AuthRequest, res: Response) {
  const { id } = validateOrThrow(userIdParamSchema, req.params);
  if (req.user?.id !== id) throw new AppError("Cannot delete other users", 403);
  await removeUser(id);
  return responseSuccess(res, null, "User deleted");
}

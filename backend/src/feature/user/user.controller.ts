import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { withLogging, withCleanup } from "../../lib/asyncHandler.js";
import { responseSuccess } from "../../lib/response.js";
import {
  deleteUploadFiles,
  deleteUploadUrls,
  uploadUrl,
} from "../../lib/uploads.js";
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

const log = logger.child({ controller: "user" });

// GET /user?search= — live search (auth required when searching) or
// recent-users list. Port of UserController.findAll. Errors bubble to
// the shared errorMiddleware.
export const listUsersController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const { search } = validateOrThrow(userSearchSchema, req.query);
    const trimmed = search.trim();
    // Strict for search: must be authenticated to get self-excluded results.
    if (trimmed && !req.user) throw new AppError("Not authenticated", 401);
    log.debug({ search: trimmed, userId: req.user?.id }, "user search");
    const users = await findAll(trimmed, req.user?.id);
    return responseSuccess(res, users);
  },
  "list-users",
  (req) => ({ userId: req.user?.id }),
);

// GET /user/:id — single profile. Port of UserController.findOne.
export const getUserController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const { id } = validateOrThrow(userIdParamSchema, req.params);
    log.debug({ id }, "user lookup");
    const user = await findUserById(id);
    if (!user) throw new AppError("User not found", 404);
    return responseSuccess(res, user);
  },
  "get-user",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

// GET /user/by-username/:username — Instagram-style canonical lookup.
export const getUserByUsernameController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { username } = validateOrThrow(usernameParamSchema, req.params);
    log.debug({ username, userId: req.user.id }, "profile lookup");
    return responseSuccess(res, await getProfile(req.user.id, username));
  },
  "get-user-by-username",
  (req) => ({ userId: req.user?.id, username: req.params.username }),
);

// PATCH /user/me — update own profile (behind requireAuth).
// Accepts JSON (bio/displayName/username/password/isPublic/removeAvatar)
// or multipart with an "avatar" image file + the same text fields.
// Multipart text fields arrive as strings, so "true"/"false" are coerced
// for booleans before validation. Uploaded file wins over removeAvatar.
// Old avatar files are unlinked on replace/clear; new files are unlinked
// if the DB update fails (no orphans) — same contract as stories/posts.
// The withCleanup wrapper runs the file unlink on any thrown error below,
// so the handler no longer needs an inline try/catch for cleanup.
export const updateMeController = withCleanup(
  async (req: AuthRequest, res: Response) => {
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

    const newAvatarUrl = file ? uploadUrl(file.filename) : undefined;

    // Snapshot the old avatar so it can be cleaned up after replace/clear.
    const current = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true },
    });
    if (!current) {
      throw new AppError("User not found", 404);
    }

    log.info({ userId: req.user.id, hasAvatar: !!file }, "profile update");
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
    if (changed && oldUrl && oldUrl !== newAvatarUrl) {
      await deleteUploadUrls([oldUrl]);
    }
    return responseSuccess(res, user);
  },
  "update-me",
  (req) => ({ userId: req.user?.id }),
  (req) => {
    const file = (req as AuthRequest & { file?: Express.Multer.File }).file;
    return file ? deleteUploadFiles([file.filename]) : Promise.resolve();
  },
);

// DELETE /user/:id — delete a user. Port of UserController.remove.
// Only self-deletion is allowed.
export const deleteUserController = withLogging(
  async (req: AuthRequest, res: Response) => {
    const { id } = validateOrThrow(userIdParamSchema, req.params);
    if (req.user?.id !== id) throw new AppError("Cannot delete other users", 403);
    log.info({ id }, "user delete");
    await removeUser(id);
    return responseSuccess(res, null, "User deleted");
  },
  "delete-user",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

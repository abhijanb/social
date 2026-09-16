import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";
import { MAX_IMAGE_BYTES } from "../post/post.upload.js";

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Multer setup for PATCH /user/me avatar upload: single image under field
// "avatar" (JPEG/PNG/WebP/GIF, 5MB max — same cap as posts/stories),
// disk storage under backend/uploads/ with uuid filenames (same contract
// as posts/stories, served at /uploads/*).
const upload = multer({
  storage: multer.diskStorage({
    destination: join(process.cwd(), "uploads"),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_AVATAR_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new AppError("Only JPEG, PNG, WebP, GIF images are allowed", 400));
  },
  limits: { fileSize: MAX_IMAGE_BYTES },
});

// Single-file ("avatar") upload wrapper with MulterError mapping.
// Optional — PATCH /user/me works with or without a file (bio-only edits
// send no multipart file at all).
export function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("avatar")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError("Avatar too large (max 5MB)", 400));
        return;
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        next(new AppError("Send a single file under field 'avatar'", 400));
        return;
      }
      next(new AppError(err.message, 400));
      return;
    }
    next(err);
  });
}

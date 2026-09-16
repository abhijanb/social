import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "../post/post.upload.js";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

// Multer setup for POST /story media upload: single file under field
// "media" (image JPEG/PNG/WebP/GIF 5MB max, or video MP4/WebM 50MB max),
// disk storage under backend/uploads/ with uuid filenames (same contract
// as posts). Multer's fileSize sits at the video cap; the tighter image
// cap is enforced in the controller.
const upload = multer({
  storage: multer.diskStorage({
    destination: join(process.cwd(), "uploads"),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype) || ALLOWED_VIDEO_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(
      new AppError(
        "Only JPEG, PNG, WebP, GIF images or MP4, WebM videos are allowed",
        400,
      ),
    );
  },
  limits: { fileSize: MAX_VIDEO_BYTES },
});

// Single-file ("media") upload wrapper with MulterError mapping.
export function uploadStoryMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("media")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(
          new AppError(
            "File too large (images max 5MB each, videos max 50MB each)",
            400,
          ),
        );
        return;
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        next(new AppError("Send a single file under field 'media'", 400));
        return;
      }
      next(new AppError(err.message, 400));
      return;
    }
    next(err);
  });
}

export { MAX_IMAGE_BYTES };

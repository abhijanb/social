import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";

/** Max image file size — enforced in the controller (see below). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Max video file size — videos need far more room than images. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

// Multer setup for POST /post media uploads. Port of the Nest
// FileInterceptor config: disk storage under backend/uploads/, uuid
// filenames, images (JPEG/PNG/WebP/GIF, 5MB max each) + videos
// (MP4/WebM, 50MB max each), up to MAX_IMAGES attachments per post
// (Instagram-style mixed carousel). Multer's fileSize limit is global
// per file so it sits at the video cap; the tighter image cap is
// enforced in the controller (which deletes rejected files).
// Multer errors are mapped to AppError so the shared errorMiddleware
// formats them.
export const MAX_IMAGES = 10;
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

// Multi-file ('images', up to MAX_IMAGES) upload wrapper with MulterError mapping.
// The field keeps its historic name — each entry may be an image or a video.
export function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.array("images", MAX_IMAGES)(req, res, (err: unknown) => {
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
        next(new AppError(`Max ${MAX_IMAGES} images per post`, 400));
        return;
      }
      next(new AppError(err.message, 400));
      return;
    }
    next(err);
  });
}

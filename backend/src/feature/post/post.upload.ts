import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { extname, join } from "node:path";
import { AppError } from "../../lib/errorHandler.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Multer setup for POST /post image uploads. Port of the Nest
// FileInterceptor config: disk storage under backend/uploads/, uuid
// filenames, JPEG/PNG/WebP/GIF only, 5MB max. Multer errors are mapped
// to AppError so the shared errorMiddleware formats them.
const upload = multer({
  storage: multer.diskStorage({
    destination: join(process.cwd(), "uploads"),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      return cb(
        new AppError("Only JPEG, PNG, WebP or GIF images are allowed", 400),
      );
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_IMAGE_BYTES },
});

// Single-file ('image') upload wrapper with MulterError mapping.
export function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(new AppError("Image too large (max 5MB)", 400));
        return;
      }
      next(new AppError(err.message, 400));
      return;
    }
    next(err);
  });
}

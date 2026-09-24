import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, join } from "node:path";
import { AppError } from "./errorHandler.js";

/** Max image file size — multer caps at the video limit; the tighter image
 * cap is enforced in controllers so rejected files can be cleaned up. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Max video file size — also multer's per-file cap. */
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

/**
 * Server-derived extension per validated mimetype. Stored filenames use
 * this — NEVER extname(originalname), which is attacker-controlled and
 * allowed storing uuid.html served as HTML (stored XSS). The fileFilter
 * below guarantees mimetype is allowlisted before storage runs, so the
 * lookup always hits; unknown mimetypes fall back to no extension
 * (served as octet-stream, never executed).
 */
const EXT_BY_MIMETYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

/** Shared disk storage: backend/uploads/ with uuid filenames. */
export function makeDiskStorage() {
  return multer.diskStorage({
    destination: join(process.cwd(), "uploads"),
    filename: (_req, file, cb) =>
      cb(null, `${randomUUID()}${EXT_BY_MIMETYPE[file.mimetype] ?? ""}`),
  });
}

/** Shared type check; avatar uploads pass allowVideo=false with their own message. */
export function makeMediaFilter(
  allowVideo: boolean,
  rejectedMessage: string,
) {
  const allowed = allowVideo
    ? (mimetype: string) =>
        ALLOWED_IMAGE_TYPES.has(mimetype) ||
        ALLOWED_VIDEO_TYPES.has(mimetype)
    : (mimetype: string) => ALLOWED_IMAGE_TYPES.has(mimetype);
  return (
    _req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (allowed(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new AppError(rejectedMessage, 400));
  };
}

export type MakeUploadOptions = {
  /** Multipart field name ("images" | "media" | "avatar"). */
  field: string;
  /** Max files for the field (1 = single). */
  maxCount: number;
  allowVideo?: boolean;
  /** Per-file byte cap (defaults to the video cap). */
  fileSize?: number;
  rejectedMessage: string;
  tooLargeMessage: string;
  unexpectedMessage: string;
};

/**
 * Builds an upload middleware with MulterError→AppError mapping.
 * Messages are parameterized so each caller keeps its exact strings.
 */
export function makeUpload({
  field,
  maxCount,
  allowVideo = true,
  fileSize = MAX_VIDEO_BYTES,
  rejectedMessage,
  tooLargeMessage,
  unexpectedMessage,
}: MakeUploadOptions) {
  const upload = multer({
    storage: makeDiskStorage(),
    fileFilter: makeMediaFilter(allowVideo, rejectedMessage),
    limits: { fileSize },
  });
  const run =
    maxCount === 1 ? upload.single(field) : upload.array(field, maxCount);
  return (req: Request, res: Response, next: NextFunction): void => {
    run(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new AppError(tooLargeMessage, 400));
          return;
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          next(new AppError(unexpectedMessage, 400));
          return;
        }
        next(new AppError(err.message, 400));
        return;
      }
      next(err);
    });
  };
}

/** Finds the first non-video file over the image cap (multer only caps video size). */
export function findOversizedImage(
  files: Express.Multer.File[],
): Express.Multer.File | undefined {
  return files.find(
    (f) => !f.mimetype.startsWith("video/") && f.size > MAX_IMAGE_BYTES,
  );
}

/** Public URL path for a stored upload filename. */
export function uploadUrl(filename: string): string {
  return `/uploads/${filename}`;
}

/** Best-effort deletion of stored upload urls (only /uploads/*, errors swallowed). */
export async function deleteUploadUrls(urls: string[]): Promise<void> {
  await Promise.allSettled(
    urls
      .filter((url) => url.startsWith("/uploads/"))
      .map((url) =>
        unlink(join(process.cwd(), "uploads", basename(url.slice("/uploads/".length)))),
      ),
  );
}

/** Best-effort deletion of stored upload filenames. */
export async function deleteUploadFiles(filenames: string[]): Promise<void> {
  await Promise.allSettled(
    filenames.map((name) =>
      unlink(join(process.cwd(), "uploads", name)).catch(() => {
        // ignore cleanup failures
      }),
    ),
  );
}

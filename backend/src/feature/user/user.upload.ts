import type { NextFunction, Request, Response } from "express";
import {
  MAX_IMAGE_BYTES,
  makeUpload,
} from "../../lib/uploads.js";

// Multer setup for PATCH /user/me avatar upload: single image under field
// "avatar" (JPEG/PNG/WebP/GIF, 5MB max — same cap as posts/stories),
// disk storage under backend/uploads/ with uuid filenames (same contract
// as posts/stories, served at /uploads/*). Optional — PATCH /user/me works
// with or without a file (bio-only edits send no multipart file at all).
export function uploadAvatar(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  makeUpload({
    field: "avatar",
    maxCount: 1,
    allowVideo: false,
    fileSize: MAX_IMAGE_BYTES,
    rejectedMessage: "Only JPEG, PNG, WebP, GIF images are allowed",
    tooLargeMessage: "Avatar too large (max 5MB)",
    unexpectedMessage: "Send a single file under field 'avatar'",
  })(req, res, next);
}

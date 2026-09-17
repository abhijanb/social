import type { NextFunction, Request, Response } from "express";
import {
  MAX_VIDEO_BYTES,
  makeUpload,
} from "../../lib/uploads.js";

// Multer setup for POST /story media upload: single file under field
// "media" (image JPEG/PNG/WebP/GIF 5MB max, or video MP4/WebM 50MB max),
// disk storage under backend/uploads/ with uuid filenames (same contract
// as posts). Multer's fileSize sits at the video cap; the tighter image
// cap is enforced in the controller.
export function uploadStoryMedia(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  makeUpload({
    field: "media",
    maxCount: 1,
    fileSize: MAX_VIDEO_BYTES,
    rejectedMessage:
      "Only JPEG, PNG, WebP, GIF images or MP4, WebM videos are allowed",
    tooLargeMessage:
      "File too large (images max 5MB each, videos max 50MB each)",
    unexpectedMessage: "Send a single file under field 'media'",
  })(req, res, next);
}

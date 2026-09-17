import type { NextFunction, Request, Response } from "express";
import {
  MAX_VIDEO_BYTES,
  makeUpload,
} from "../../lib/uploads.js";

// Multer setup for POST /post media uploads: up to MAX_IMAGES attachments
// under field "images" (each entry an image JPEG/PNG/WebP/GIF 5MB max, or a
// video MP4/WebM 50MB max — Instagram-style mixed carousel). Multer's
// fileSize sits at the video cap; the tighter image cap is enforced in the
// controller (which deletes rejected files). The field keeps its historic
// name — each entry may be an image or a video.
export const MAX_IMAGES = 10;

export function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  makeUpload({
    field: "images",
    maxCount: MAX_IMAGES,
    fileSize: MAX_VIDEO_BYTES,
    rejectedMessage:
      "Only JPEG, PNG, WebP, GIF images or MP4, WebM videos are allowed",
    tooLargeMessage:
      "File too large (images max 5MB each, videos max 50MB each)",
    unexpectedMessage: `Max ${MAX_IMAGES} images per post`,
  })(req, res, next);
}

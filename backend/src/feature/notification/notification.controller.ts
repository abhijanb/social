import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { responseSuccess } from "../../lib/response.js";
import { validateOrThrow } from "../../lib/validate.js";
import type { AuthRequest } from "../../middleware/auth.js";
import {
  countUnreadNotifications,
  findNotifications,
} from "./notification.query.js";
import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.request.js";
import { notificationIdParamSchema } from "./notification.schema.js";

const log = logger.child({ controller: "notification" });

// GET /notification — own non-deleted, newest first. requireAuth.
export async function listNotificationsController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  log.debug({ userId: req.user.id }, "notifications list");
  return responseSuccess(res, await findNotifications(req.user.id));
}

// GET /notification/unread-count — { count } for the navbar bell badge.
export async function getUnreadCountController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const count = await countUnreadNotifications(req.user.id);
  log.debug({ userId: req.user.id, count }, "unread count");
  return responseSuccess(res, { count });
}

// PATCH /notification/:id/read — mark own notification as read.
export async function markNotificationReadController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(notificationIdParamSchema, req.params);
  log.debug({ userId: req.user.id, id }, "mark read");
  return responseSuccess(res, await markNotificationAsRead(id, req.user.id));
}

export async function markAllNotificationsReadController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  log.info({ userId: req.user.id }, "mark all read");
  return responseSuccess(res, await markAllNotificationsAsRead(req.user.id));
}

// DELETE /notification/:id — soft-delete own notification.
export async function deleteNotificationController(
  req: AuthRequest,
  res: Response,
) {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const { id } = validateOrThrow(notificationIdParamSchema, req.params);
  log.info({ userId: req.user.id, id }, "notification delete");
  await deleteNotification(id, req.user.id);
  return responseSuccess(res, null, "Notification deleted");
}

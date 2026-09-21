import type { Response } from "express";
import { AppError } from "../../lib/errorHandler.js";
import { logger } from "../../lib/logger.js";
import { withLogging } from "../../lib/asyncHandler.js";
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
export const listNotificationsController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    log.debug({ userId: req.user.id }, "notifications list");
    return responseSuccess(res, await findNotifications(req.user.id));
  },
  "list-notifications",
  (req) => ({ userId: req.user?.id }),
);

// GET /notification/unread-count — { count } for the navbar bell badge.
export const getUnreadCountController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const count = await countUnreadNotifications(req.user.id);
    log.debug({ userId: req.user.id, count }, "unread count");
    return responseSuccess(res, { count });
  },
  "unread-count",
  (req) => ({ userId: req.user?.id }),
);

// PATCH /notification/:id/read — mark own notification as read.
export const markNotificationReadController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(notificationIdParamSchema, req.params);
    log.debug({ userId: req.user.id, id }, "mark read");
    return responseSuccess(res, await markNotificationAsRead(id, req.user.id));
  },
  "mark-read",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

export const markAllNotificationsReadController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    log.info({ userId: req.user.id }, "mark all read");
    return responseSuccess(res, await markAllNotificationsAsRead(req.user.id));
  },
  "mark-all-read",
  (req) => ({ userId: req.user?.id }),
);

// DELETE /notification/:id — soft-delete own notification.
export const deleteNotificationController = withLogging(
  async (req: AuthRequest, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const { id } = validateOrThrow(notificationIdParamSchema, req.params);
    log.info({ userId: req.user.id, id }, "notification delete");
    await deleteNotification(id, req.user.id);
    return responseSuccess(res, null, "Notification deleted");
  },
  "delete-notification",
  (req) => ({ userId: req.user?.id, id: req.params.id }),
);

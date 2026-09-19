import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  deleteNotificationController,
  getUnreadCountController,
  listNotificationsController,
  markNotificationReadController,
} from "./notification.controller.js";

export const notificationRouter = Router();

// NOTE: /unread-count is registered before /:id/read and /:id so
// "unread-count" is not captured as an id param.
notificationRouter.get("/", requireAuth, listNotificationsController);
notificationRouter.get(
  "/unread-count",
  requireAuth,
  getUnreadCountController,
);
notificationRouter.patch(
  "/:id/read",
  requireAuth,
  markNotificationReadController,
);
notificationRouter.delete("/:id", requireAuth, deleteNotificationController);

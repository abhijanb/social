import { AppError } from "../../lib/errorHandler.js";
import { prisma } from "../../lib/prisma.js";
import type { NotificationType } from "../../generated/prisma/enums.js";

// Create a notification row for a user. Used by future producers
// (friendship/post/story/livestream events); no producers call it yet.
export async function saveNotificationToDatabase(
  userId: string,
  message: string,
  type: NotificationType,
) {
  return prisma.notification.create({
    data: { userId, content: message, type },
  });
}

async function assertOwnNotification(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.isDeleted) {
    throw new AppError("Notification not found", 404);
  }
  if (notification.userId !== userId) {
    throw new AppError("Not your notification", 403);
  }
  return notification;
}

// Mark own notification as read. Missing/deleted → 404, another user's → 403.
export async function markNotificationAsRead(id: string, userId: string) {
  await assertOwnNotification(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

// Soft-delete own notification. Missing/deleted → 404, another user's → 403.
export async function deleteNotification(id: string, userId: string) {
  await assertOwnNotification(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { isDeleted: true },
  });
}

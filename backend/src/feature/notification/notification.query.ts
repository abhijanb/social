import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";

const log = logger.child({ service: "notification" });

// Own non-deleted notifications, newest first.
export async function findNotifications(userId: string) {
  log.debug({ userId }, "notifications list");
  return prisma.notification.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
}

// Unread (and non-deleted) count for the navbar bell badge.
export async function countUnreadNotifications(userId: string) {
  log.debug({ userId }, "unread count");
  return prisma.notification.count({
    where: { userId, isDeleted: false, isRead: false },
  });
}

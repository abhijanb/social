import { prisma } from "../../lib/prisma.js";

// Own non-deleted notifications, newest first.
export async function findNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
}

// Unread (and non-deleted) count for the navbar bell badge.
export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, isDeleted: false, isRead: false },
  });
}

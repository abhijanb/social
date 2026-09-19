import { defineSchedule } from "../core/scheduler.js";
import { prisma } from "../../lib/prisma.js";
import { sendMailToUser } from "../../feature/notification/mailNotification.js";

// Hourly digest of story views — batches all views from the last hour
// into one email per recipient. Avoids per-view emails while keeping
// notifications instant in the UI (only email is batched).
export const storyViewDigest = defineSchedule({
  name: "story-view-digest",
  cron: "0 * * * *",
  run: async () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const notifications = await prisma.notification.findMany({
      where: {
        type: "STORY_VIEW",
        isEmailSent: false,
        isDeleted: false,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (notifications.length === 0) return { sent: 0 };

    // Group viewers by recipient userId.
    const groups = new Map<string, Set<string>>();
    for (const n of notifications) {
      if (!n.relatedUser) continue;
      if (!groups.has(n.userId)) groups.set(n.userId, new Set());
      groups.get(n.userId)!.add(n.relatedUser);
    }

    let sent = 0;
    await Promise.all(
      Array.from(groups.entries()).map(async ([recipientId, viewerIds]) => {
        const viewers = await Promise.all(
          Array.from(viewerIds).map(async (viewerId) => {
            const user = await prisma.user.findUnique({
              where: { id: viewerId },
              select: { username: true },
            });
            return user?.username ?? viewerId;
          }),
        );

        const count = viewers.length;
        const viewerList = viewers.join(", ");
        await sendMailToUser(recipientId, {
          subject: `${count} story ${count === 1 ? "view" : "views"} this hour`,
          text: `${count} person${count === 1 ? "" : "s"} viewed your story in the last hour: ${viewerList}.`,
          html: `<p>${count} person${count === 1 ? "" : "s"} viewed your story in the last hour: ${viewerList}.</p>`,
        }).catch(console.error);
        sent++;
      }),
    );

    await prisma.notification.updateMany({
      where: {
        type: "STORY_VIEW",
        isEmailSent: false,
        isDeleted: false,
        createdAt: { gte: oneHourAgo },
      },
      data: { isEmailSent: true },
    });

    return { sent };
  },
});

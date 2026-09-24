import { prisma } from "../../lib/prisma.js";
import { defineSchedule } from "../core/scheduler.js";

// Daily off-peak purge of dead sessions: expired rows plus revoked rows
// past 30-day retention (kept briefly so "last active" stays truthful).
export const sessionPurge = defineSchedule({
  name: "session-purge",
  cron: "0 2 * * *",
  run: async () => {
    const now = new Date();
    const retentionCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { lt: retentionCutoff } },
        ],
      },
    });
    return { sessions: result.count };
  },
});

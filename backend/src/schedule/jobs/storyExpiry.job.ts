import { defineSchedule } from "../core/scheduler.js";
import { softDeleteExpiredStories } from "../../feature/story/story.service.js";

// Daily off-peak soft-delete of stories past their 24h expiry.
// Stamped rows carry a fresh deletedAt, so the same-night purge
// (which only touches 30+ day stamps) can never sweep them.
export const storyExpiry = defineSchedule({
  name: "story-expiry",
  cron: "0 2 * * *",
  run: () => softDeleteExpiredStories(),
});

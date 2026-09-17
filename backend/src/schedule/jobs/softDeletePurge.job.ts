import { defineSchedule } from "../core/scheduler.js";
import { purgeDeletedComments } from "../../feature/post/post.comments.js";

// Daily off-peak purge of soft-deleted comments past the 30-day retention.
export const softDeletePurge = defineSchedule({
  name: "soft-delete-purge",
  cron: "0 2 * * *",
  run: () => purgeDeletedComments(),
});

import { deleteUploadUrls } from "../../lib/uploads.js";
import { defineSchedule } from "../core/scheduler.js";
import { purgeDeletedComments } from "../../feature/post/post.comments.js";
import { purgeDeletedStories } from "../../feature/story/story.service.js";

// Daily off-peak purge of soft-deleted rows past the 30-day retention.
// Comments hold text only; story media files are unlinked after row removal.
export const softDeletePurge = defineSchedule({
  name: "soft-delete-purge",
  cron: "0 2 * * *",
  run: async () => {
    const [comments, stories] = await Promise.all([
      purgeDeletedComments(),
      purgeDeletedStories(),
    ]);
    await deleteUploadUrls(stories.urls);
    return { comments: comments.deleted, stories: stories.deleted };
  },
});

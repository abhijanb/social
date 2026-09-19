import type { DefinedSchedule } from "../core/scheduler.js";
import { softDeletePurge } from "./softDeletePurge.job.js";
import { storyExpiry } from "./storyExpiry.job.js";
import { storyViewDigest } from "./storyViewDigest.job.js";

// Job registry — startSchedules(schedules) runs in index.ts.
// Story view digest runs hourly; both purge jobs fire daily at 02:00.
export const schedules: DefinedSchedule[] = [storyViewDigest, storyExpiry, softDeletePurge];

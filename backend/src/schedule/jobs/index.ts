import type { DefinedSchedule } from "../core/scheduler.js";
import { softDeletePurge } from "./softDeletePurge.job.js";
import { storyExpiry } from "./storyExpiry.job.js";

// Job registry — startSchedules(schedules) runs in index.ts.
// Both fire at 02:00; order here is cosmetic. Safety comes from deletedAt
// gating: the purge only touches rows stamped 30+ days ago, so a story the
// expiry job stamps tonight can never be purged the same night.
export const schedules: DefinedSchedule[] = [storyExpiry, softDeletePurge];

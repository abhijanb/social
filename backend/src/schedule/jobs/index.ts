import type { DefinedSchedule } from "../core/scheduler.js";
import { softDeletePurge } from "./softDeletePurge.job.js";

// Job registry — startSchedules(schedules) runs in index.ts.
// Future jobs (e.g. story cleanup) slot in here without touching wiring.
export const schedules: DefinedSchedule[] = [softDeletePurge];

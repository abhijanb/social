import cron, { type ScheduledTask } from "node-cron";

export type ScheduleJob = {
  /** Unique name — used in logs and task registry. */
  name: string;
  /** Cron expression (invalid patterns throw on define). */
  cron: string;
  /** Tick handler; overlapping runs are skipped, errors only log. */
  run: () => Promise<unknown>;
  /** Fire once immediately on start (default false). */
  runOnStart?: boolean;
};

export type DefinedSchedule = ScheduleJob & {
  task: ScheduledTask;
  start: () => void;
  stop: () => void;
};

/**
 * Defines a reusable cron schedule (created stopped — start it explicitly).
 * Invalid cron expressions throw here so bad schedules fail fast at
 * startup, not silently. Ticks never overlap (node-cron noOverlap) and
 * never hold the event loop open (unref, like the old setInterval).
 */
export function defineSchedule(job: ScheduleJob): DefinedSchedule {
  if (!cron.validate(job.cron)) {
    throw new Error(`[schedule:${job.name}] invalid cron: ${job.cron}`);
  }
  const task = cron.schedule(
    job.cron,
    () => {
      job.run().catch((err) => console.error(`[schedule:${job.name}] failed`, err));
    },
    { name: job.name, noOverlap: true, unref: true },
  );
  task.stop();
  return {
    ...job,
    task,
    start: () => {
      task.start();
      if (job.runOnStart) {
        void job
          .run()
          .catch((err) => console.error(`[schedule:${job.name}] failed`, err));
      }
    },
    stop: () => {
      task.stop();
    },
  };
}

/** Starts every schedule (jobs run on their cron cadence). */
export function startSchedules(schedules: DefinedSchedule[]): void {
  for (const schedule of schedules) schedule.start();
}

/** Stops every schedule (for graceful shutdown). */
export function stopSchedules(schedules: DefinedSchedule[]): void {
  for (const schedule of schedules) schedule.stop();
}

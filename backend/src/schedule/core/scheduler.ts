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

export function defineSchedule(job: ScheduleJob): DefinedSchedule {
  if (!cron.validate(job.cron)) {
    throw new Error(`[schedule:${job.name}] invalid cron: ${job.cron}`);
  }
  const task = cron.schedule(
    job.cron,
    () => {
      job
        .run()
        .catch(() => {
          // errors are swallowed by the schedule infrastructure
        });
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
        job
          .run()
          .catch(() => {
            // errors are swallowed by the schedule infrastructure
          });
      }
    },
    stop: () => {
      task.stop();
    },
  };
}

export function startSchedules(schedules: DefinedSchedule[]): void {
  for (const schedule of schedules) {
    schedule.start();
  }
}

export function stopSchedules(schedules: DefinedSchedule[]): void {
  for (const schedule of schedules) schedule.stop();
}

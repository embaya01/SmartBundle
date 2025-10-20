import cron from "node-cron";
import { logger } from "./logger";
import { enqueueIngestionJob } from "./jobs";
import { loadSourceConfig, type SourceConfig } from "./config";

interface ScheduledSource extends SourceConfig {
  name: string;
}

function scheduleSource({ name, schedule, timezone, options }: ScheduledSource) {
  logger.info({ name, schedule, timezone }, "Scheduling ingestion source");
  cron.schedule(
    schedule,
    async () => {
      try {
        await enqueueIngestionJob({ source: name, options });
        logger.info({ name }, "Enqueued scheduled ingestion job");
      } catch (error) {
        logger.error({ name, error }, "Failed to enqueue scheduled ingestion job");
      }
    },
    {
      timezone,
    },
  );
}

export async function startScheduler() {
  const config = await loadSourceConfig();
  const entries = Object.entries(config)
    .filter(([name, cfg]) => {
      if (!cfg) return false;
      if (cfg.active === false) {
        logger.info({ name }, "Source marked inactive; skipping schedule");
        return false;
      }
      if (!cfg.schedule) {
        logger.warn({ name }, "Source missing schedule; skipping");
        return false;
      }
      return true;
    })
    .map(([name, cfg]) => ({ name, ...cfg }));

  if (!entries.length) {
    logger.warn("No active sources found in configuration; scheduler idle");
    return;
  }

  entries.forEach(scheduleSource);
  logger.info({ count: entries.length }, "Scheduler started");
}

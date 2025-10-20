import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from './redis';
import { logger } from './logger';

export const INGEST_QUEUE_NAME = process.env.INGEST_QUEUE_NAME ?? 'smartbundle:ingest';

export const ingestQueue = new Queue(INGEST_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const ingestQueueEvents = new QueueEvents(INGEST_QUEUE_NAME, {
  connection: redisConnection,
});

ingestQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, 'Ingestion job failed');
});

ingestQueueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId }, 'Ingestion job completed');
});

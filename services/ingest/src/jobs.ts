import { Job, JobsOptions } from 'bullmq';
import { ingestQueue } from './queue';
import type { IngestionJobData } from './types';

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 200,
  removeOnFail: 500,
};

export function enqueueIngestionJob(data: IngestionJobData, options: JobsOptions = {}): Promise<Job> {
  return ingestQueue.add('ingest', data, { ...defaultJobOptions, ...options });
}

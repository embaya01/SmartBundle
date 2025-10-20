import { IngestionStatus } from '@prisma/client';
import { logger } from '../logger';
import { prisma } from './prisma';

const dbEnabled = () => Boolean(process.env.DATABASE_URL);

interface BaseRunInput {
  runId: string;
  source: string;
}

export async function startIngestionRun({ runId, source }: BaseRunInput) {
  if (!dbEnabled()) return;

  try {
    await prisma.ingestionRun.upsert({
      where: { id: runId },
      update: {
        source,
        status: IngestionStatus.running,
        startedAt: new Date(),
        finishedAt: null,
        errorMessage: null,
        bundlesIngested: 0,
        bundlesFailed: 0,
      },
      create: {
        id: runId,
        source,
        status: IngestionStatus.running,
      },
    });
  } catch (error) {
    logger.error({ runId, source, error }, 'Failed to record ingestion run start');
  }
}

interface CompleteRunInput extends BaseRunInput {
  bundlesIngested: number;
  bundlesFailed: number;
  status?: IngestionStatus;
}

export async function completeIngestionRun({
  runId,
  source,
  bundlesIngested,
  bundlesFailed,
  status = IngestionStatus.success,
}: CompleteRunInput) {
  if (!dbEnabled()) return;

  try {
    await prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
        bundlesIngested,
        bundlesFailed,
        errorMessage: null,
      },
    });
  } catch (error) {
    logger.error({ runId, source, error }, 'Failed to record ingestion run completion');
  }
}

interface FailRunInput extends BaseRunInput {
  error: unknown;
  bundlesIngested: number;
  bundlesFailed: number;
}

export async function failIngestionRun({
  runId,
  source,
  error,
  bundlesIngested,
  bundlesFailed,
}: FailRunInput) {
  if (!dbEnabled()) return;

  const message = error instanceof Error ? error.message : String(error);

  try {
    await prisma.ingestionRun.update({
      where: { id: runId },
      data: {
        status: IngestionStatus.failed,
        finishedAt: new Date(),
        bundlesIngested,
        bundlesFailed,
        errorMessage: message,
      },
    });
  } catch (err) {
    logger.error({ runId, source, error: err }, 'Failed to record ingestion run failure');
  }
}

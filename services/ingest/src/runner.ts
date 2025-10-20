import { nanoid } from 'nanoid';
import { getScraper } from './scrapers/registry';
import { logger } from './logger';
import { normalizeScrapedBundle } from './normalize';
import { persistBundles } from './db/persistence';
import { startIngestionRun, completeIngestionRun, failIngestionRun } from './db/ingestionRun';
import type { IngestionJobData } from './types';
import type { ScrapedBundle } from './scrapers/types';
import type { Bundle } from '@smartbundle/shared/types';

export async function runIngestionJob(job: IngestionJobData) {
  const scraper = getScraper(job.source);
  if (!scraper) {
    throw new Error(`No scraper registered for source ${job.source}`);
  }

  const runId = job.runId ?? nanoid();
  await startIngestionRun({ runId, source: job.source });
  const context = {
    logger,
    runId,
    source: job.source,
    options: job.options ?? {},
    request: fetch,
  } as const;

  logger.info({ source: job.source, runId }, 'Starting ingestion run');

  let scraped: ScrapedBundle[] = [];
  let normalized: Bundle[] = [];

  try {
    scraped = await scraper.fetch(context);
    logger.info({ source: job.source, runId, count: scraped.length }, 'Fetched bundles');

    normalized = scraped
      .map((item) => normalizeScrapedBundle(item, logger))
      .filter((bundle): bundle is Bundle => Boolean(bundle));

    logger.info({ source: job.source, runId, count: normalized.length }, 'Normalized bundles');

    const persistence = await persistBundles({ bundles: normalized, runId, source: job.source });

    await completeIngestionRun({
      runId,
      source: job.source,
      bundlesIngested: persistence.upserts,
      bundlesFailed: Math.max(0, scraped.length - normalized.length),
    });

    return {
      runId,
      source: job.source,
      fetched: scraped.length,
      normalized: normalized.length,
      persisted: persistence.upserts,
      skipped: persistence.skipped,
      created: persistence.created,
      updated: persistence.updated,
      history: persistence.history,
      deactivated: persistence.deactivated,
    };
  } catch (error) {
    await failIngestionRun({
      runId,
      source: job.source,
      error,
      bundlesIngested: normalized.length,
      bundlesFailed: Math.max(0, scraped.length - normalized.length),
    });
    throw error;
  }
}


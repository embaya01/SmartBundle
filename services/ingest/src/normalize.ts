import { canonicalizeServiceName, normalizeSearchText } from '@smartbundle/shared/normalizers';
import { bundleSchema } from '@smartbundle/shared/validation';
import type { Bundle } from '@smartbundle/shared/types';
import type { ScrapedBundle } from './scrapers/types';
import type { Logger } from './logger';

export function normalizeScrapedBundle(raw: ScrapedBundle, logger: Logger): Bundle | null {
  const normalized: ScrapedBundle = {
    ...raw,
    services: raw.services.map(canonicalizeServiceName),
    tags: raw.tags.map((tag) => normalizeSearchText(tag)),
  };

  const result = bundleSchema.safeParse(normalized);

  if (!result.success) {
    logger.warn({ id: raw.id, errors: result.error.flatten().fieldErrors }, 'Dropping invalid scraped bundle');
    return null;
  }

  return result.data;
}

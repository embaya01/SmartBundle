import type { Scraper } from '../scrapers/types';
import { logger } from '../logger';

const registry = new Map<string, Scraper>();

export function registerScraper(name: string, scraper: Scraper) {
  if (registry.has(name)) {
    logger.warn({ name }, 'Scraper already registered, replacing existing handler');
  }
  registry.set(name, scraper);
}

export function getScraper(name: string): Scraper | null {
  const scraper = registry.get(name);
  if (!scraper) {
    logger.error({ name }, 'No scraper registered for source');
    return null;
  }
  return scraper;
}

export function listScrapers(): string[] {
  return [...registry.keys()].sort();
}

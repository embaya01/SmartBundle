import { registerScraper } from './registry';
import type { Scraper } from './types';

// Placeholder scrapers can be registered here.
// Example:
// const exampleScraper: Scraper = {
//   async fetch(context) {
//     context.logger.info({ source: context.source }, 'Fetching bundles (stub)');
//     return [];
//   },
// };
// registerScraper('example', exampleScraper);

export function initializeScrapers() {
  // Future implementations will register concrete scrapers here.
}

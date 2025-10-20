import type { ScrapeContext } from '../types';

export interface ScrapedBundle {
  id: string;
  name: string;
  services: string[];
  price: number;
  currency: string;
  billingCycle: 'mo' | 'yr';
  regions: string[];
  provider: string;
  link: string;
  tags: string[];
  summary?: string;
  source: string;
  rawPayload?: unknown;
}

export interface Scraper {
  /**
   * Fetch raw bundle records from the source.
   */
  fetch(context: ScrapeContext): Promise<ScrapedBundle[]>;
}

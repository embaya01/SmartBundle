export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export interface Bundle {
  id: string;
  name: string;
  services: string[];
  price: number;
  currency: CurrencyCode;
  billingCycle: 'mo' | 'yr';
  regions: string[];
  provider: string;
  link: string;
  tags: string[];
  summary?: string;
  isActive: boolean;
  lastVerified?: string;
  source?: 'official' | 'carrier' | 'partner' | 'aggregator';
  scrapeMeta?: {
    firstSeen?: string;
    lastSeen?: string;
    confidence?: number;
  };
}

export type BundleMap = Record<string, Bundle>;

export interface BundleSearchParams {
  q?: string;
  priceMin?: number;
  priceMax?: number;
  regions?: string[];
  providers?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'recent';
}

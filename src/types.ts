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
}

export type BundleMap = Record<string, Bundle>;

import type { Bundle, BundleSearchParams } from '../types';

export type SearchParams = BundleSearchParams;

export interface FacetSummary {
  regions: string[];
  providers: string[];
  tags: string[];
  price: { min: number; max: number };
}

export interface DataProvider {
  listBundles(params: SearchParams): Promise<{ items: Bundle[]; total: number }>;
  getBundleById(id: string): Promise<Bundle | null>;
  listFacets(): Promise<FacetSummary>;
}

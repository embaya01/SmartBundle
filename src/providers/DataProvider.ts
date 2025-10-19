import type { Bundle } from '../types';

export interface SearchParams {
  q?: string;
  priceMin?: number;
  priceMax?: number;
  regions?: string[];
  providers?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}

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

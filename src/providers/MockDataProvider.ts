import rawBundles from '../data/bundles.json' assert { type: 'json' };
import type { Bundle } from '../types';
import { runSearch } from '../lib/search';
import { validateBundles } from '../lib/validation';
import type { DataProvider, FacetSummary, SearchParams } from './DataProvider';

function buildIndex(bundles: Bundle[]): Map<string, Bundle> {
  return bundles.reduce((acc, bundle) => acc.set(bundle.id, bundle), new Map<string, Bundle>());
}

function computeFacets(bundles: Bundle[]): FacetSummary {
  const active = bundles.filter((bundle) => bundle.isActive);

  const regions = new Set<string>();
  const providers = new Set<string>();
  const tags = new Set<string>();

  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  active.forEach((bundle) => {
    bundle.regions.forEach((region) => regions.add(region));
    providers.add(bundle.provider);
    bundle.tags.forEach((tag) => tags.add(tag));
    minPrice = Math.min(minPrice, bundle.price);
    maxPrice = Math.max(maxPrice, bundle.price);
  });

  if (!Number.isFinite(minPrice)) {
    minPrice = 0;
  }

  return {
    regions: Array.from(regions).sort(),
    providers: Array.from(providers).sort(),
    tags: Array.from(tags).sort(),
    price: {
      min: Math.floor(minPrice),
      max: Math.ceil(maxPrice),
    },
  };
}

export class MockDataProvider implements DataProvider {
  private readonly bundles: Bundle[];

  private readonly index: Map<string, Bundle>;

  private readonly facets: FacetSummary;

  constructor(seed: unknown = rawBundles) {
    this.bundles = validateBundles(seed);
    this.index = buildIndex(this.bundles);
    this.facets = computeFacets(this.bundles);
  }

  async listBundles(params: SearchParams): Promise<{ items: Bundle[]; total: number }> {
    return runSearch(this.bundles, params);
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    return this.index.get(id) ?? null;
  }

  async listFacets(): Promise<FacetSummary> {
    return this.facets;
  }
}

export default MockDataProvider;

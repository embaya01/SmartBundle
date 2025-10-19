import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import SearchBar from '../components/SearchBar';
import Filters from '../components/Filters';
import type { FilterCounts, FiltersState } from '../components/Filters';
import BundleGrid from '../components/BundleGrid';
import EmptyState from '../components/EmptyState';
import DetailSheet from '../components/DetailSheet';
import LoadingShimmer from '../components/LoadingShimmer';
import MockDataProvider from '../providers/MockDataProvider';
import type { Bundle } from '../types';
import type { FacetSummary } from '../providers/DataProvider';
import { trackViewDeal } from '../lib/analytics';

const DEFAULT_PAGE_SIZE = 6;
const STORAGE_VERSION = 1;
const STORAGE_KEY = `smartbundle:v${STORAGE_VERSION}:state`;

const createDefaultFilters = (): FiltersState => ({
  priceMin: undefined,
  priceMax: undefined,
  regions: [],
  providers: [],
  tags: [],
});

const emptyCounts: FilterCounts = {
  regions: {},
  providers: {},
  tags: {},
};

const cloneFilters = (filters: FiltersState): FiltersState => ({
  priceMin: filters.priceMin,
  priceMax: filters.priceMax,
  regions: [...filters.regions],
  providers: [...filters.providers],
  tags: [...filters.tags],
});

const hasActiveFilters = (filters: FiltersState) =>
  typeof filters.priceMin === 'number' ||
  typeof filters.priceMax === 'number' ||
  filters.regions.length > 0 ||
  filters.providers.length > 0 ||
  filters.tags.length > 0;

const sanitizeMulti = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value): value is string => Boolean(value)),
    ),
  );

const parseNumber = (value: string | null | undefined): number | undefined => {
  if (!value?.length) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseSearchState = (search: string) => {
  const params = new URLSearchParams(search);

  const q = params.get('q') ?? '';
  const priceMin = parseNumber(params.get('min'));
  const priceMax = parseNumber(params.get('max'));
  const regions = sanitizeMulti(params.getAll('region'));
  const providers = sanitizeMulti(params.getAll('provider'));
  const tags = sanitizeMulti(params.getAll('tag'));
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const filters: FiltersState = {
    priceMin,
    priceMax,
    regions,
    providers,
    tags,
  };

  return {
    query: q,
    filters,
    page,
  };
};

interface PersistedState {
  version: number;
  query: string;
  filters: FiltersState;
}

const loadPersistedState = (): PersistedState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed || parsed.version !== STORAGE_VERSION) {
      return null;
    }

    const filters = parsed.filters ?? createDefaultFilters();

    return {
      version: STORAGE_VERSION,
      query: typeof parsed.query === 'string' ? parsed.query : '',
      filters: {
        priceMin: typeof filters.priceMin === 'number' ? filters.priceMin : undefined,
        priceMax: typeof filters.priceMax === 'number' ? filters.priceMax : undefined,
        regions: Array.isArray(filters.regions) ? sanitizeMulti(filters.regions) : [],
        providers: Array.isArray(filters.providers) ? sanitizeMulti(filters.providers) : [],
        tags: Array.isArray(filters.tags) ? sanitizeMulti(filters.tags) : [],
      },
    };
  } catch (error) {
    console.warn('[SmartBundle] Failed to read persisted state', error);
    return null;
  }
};

const buildSearchParams = (query: string, filters: FiltersState, page: number) => {
  const params = new URLSearchParams();

  if (query.trim()) params.set('q', query.trim());
  if (typeof filters.priceMin === 'number') params.set('min', String(filters.priceMin));
  if (typeof filters.priceMax === 'number') params.set('max', String(filters.priceMax));
  filters.regions.forEach((region) => params.append('region', region));
  filters.providers.forEach((provider) => params.append('provider', provider));
  filters.tags.forEach((tag) => params.append('tag', tag));
  if (page > 1) params.set('page', String(page));

  return params.toString();
};

const computeCounts = (bundles: Bundle[]): FilterCounts => {
  const regions: Record<string, number> = {};
  const providers: Record<string, number> = {};
  const tags: Record<string, number> = {};

  bundles
    .filter((bundle) => bundle.isActive)
    .forEach((bundle) => {
      bundle.regions.forEach((region) => {
        regions[region] = (regions[region] ?? 0) + 1;
      });

      providers[bundle.provider] = (providers[bundle.provider] ?? 0) + 1;

      bundle.tags.forEach((tag) => {
        tags[tag] = (tags[tag] ?? 0) + 1;
      });
    });

  return { regions, providers, tags };
};

const App = () => {
  const provider = useMemo(() => new MockDataProvider(), []);
  const initialState = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        query: '',
        filters: createDefaultFilters(),
        page: 1,
      };
    }

    const urlState = parseSearchState(window.location.search);
    const persisted = loadPersistedState();

    let query = urlState.query;
    let filters = cloneFilters(urlState.filters);

    if (persisted) {
      if (!query && persisted.query) {
        query = persisted.query;
      }

      if (!hasActiveFilters(filters) && hasActiveFilters(persisted.filters)) {
        filters = cloneFilters(persisted.filters);
      }
    }

    return {
      query,
      filters,
      page: urlState.page,
    };
  }, []);

  const [query, setQuery] = useState(initialState.query);
  const [filters, setFilters] = useState<FiltersState>(initialState.filters);
  const [page, setPage] = useState<number>(initialState.page);

  const [results, setResults] = useState<Bundle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facets, setFacets] = useState<FacetSummary | null>(null);
  const [counts, setCounts] = useState<FilterCounts>(emptyCounts);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const snapshot: PersistedState = {
        version: STORAGE_VERSION,
        query,
        filters: cloneFilters(filters),
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('[SmartBundle] Failed to persist state', error);
    }
  }, [query, filtersKey, filters]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const [facetData, allBundleData] = await Promise.all([
          provider.listFacets(),
          provider.listBundles({ limit: 1000 }),
        ]);

        if (!active) return;

        setFacets(facetData);
        setCounts(computeCounts(allBundleData.items));
      } catch (bootstrapError) {
        if (!active) return;
        console.error('Failed to bootstrap data providers', bootstrapError);
        setError('Failed to load subscription bundle data. Please try again.');
        setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [provider]);

  useEffect(() => {
    let active = true;

    const fetchBundles = async () => {
      setLoading(true);
      setError(null);

      const params = {
        q: query.trim() || undefined,
        priceMin: filters.priceMin,
        priceMax: filters.priceMax,
        regions: filters.regions.length ? filters.regions : undefined,
        providers: filters.providers.length ? filters.providers : undefined,
        tags: filters.tags.length ? filters.tags : undefined,
        limit: DEFAULT_PAGE_SIZE,
        offset: (page - 1) * DEFAULT_PAGE_SIZE,
      };

      try {
        const { items, total: totalMatches } = await provider.listBundles(params);

        if (!active) return;

        setResults(items);
        setTotal(totalMatches);

        if (page > 1 && items.length === 0 && totalMatches > 0) {
          const maxPage = Math.max(1, Math.ceil(totalMatches / DEFAULT_PAGE_SIZE));
          setPage(maxPage);
        }
      } catch (listError) {
        if (!active) return;
        console.error('Failed to fetch bundles', listError);
        setError('Unable to fetch bundles. Please adjust filters or try again later.');
        setResults([]);
        setTotal(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchBundles();

    return () => {
      active = false;
    };
  }, [provider, query, filtersKey, page]);

  useEffect(() => {
    const paramsString = buildSearchParams(query, filters, page);
    const nextSearch = paramsString ? `?${paramsString}` : '';

    if (window.location.search !== nextSearch) {
      window.history.replaceState(null, '', `${window.location.pathname}${nextSearch}`);
    }
  }, [query, filtersKey, page]);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseSearchState(window.location.search);
      setQuery(next.query);
      setFilters(cloneFilters(next.filters));
      setPage(next.page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSearch = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  };

  const handleFilterChange = (nextFilters: FiltersState) => {
    setFilters(cloneFilters(nextFilters));
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleSelectBundle = (bundle: Bundle) => {
    setSelectedBundle(bundle);
  };

  const handleCloseDetail = () => {
    setSelectedBundle(null);
  };

  const handleClearAll = () => {
    setQuery('');
    setFilters(createDefaultFilters());
    setPage(1);
  };

  const handleViewDeal = (bundle: Bundle) => {
    trackViewDeal(bundle);
  };

  const summaryText = query ? `Showing results for "${query}"` : `Showing ${total} active bundles`;

  let content: ReactNode;
  if (loading) {
    content = <LoadingShimmer count={DEFAULT_PAGE_SIZE} />;
  } else if (error) {
    content = (
      <EmptyState
        title="We hit a snag loading bundles."
        message={error}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Refresh
          </button>
        }
      />
    );
  } else if (!results.length) {
    content = (
      <EmptyState
        title="No bundles match your filters just yet."
        message="Try broadening your search terms or clearing some filters to explore more offers."
        action={
          <button
            type="button"
            onClick={handleClearAll}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Clear search & filters
          </button>
        }
      />
    );
  } else {
    content = (
      <BundleGrid
        bundles={results}
        total={total}
        page={page}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={handlePageChange}
        onSelect={handleSelectBundle}
        onViewDeal={handleViewDeal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-600">
              SmartBundle
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Discover streaming and subscription bundles in one place.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Search across student deals, family plans, carrier perks, and regional offers. We validate
              every listing so you can plug in live data sources later with confidence.
            </p>
          </div>
          <SearchBar value={query} onSearch={handleSearch} />
          <p className="text-sm font-medium text-slate-500">{summaryText}</p>
        </header>

        <div className="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[320px_1fr] lg:items-start">
          <Filters
            facets={facets}
            value={filters}
            counts={counts}
            onChange={handleFilterChange}
            disabled={!facets}
          />
          <section className="flex flex-col gap-6">{content}</section>
        </div>
      </main>

      <DetailSheet bundle={selectedBundle} open={Boolean(selectedBundle)} onClose={handleCloseDetail} onViewDeal={handleViewDeal} />
    </div>
  );
};

export default App;

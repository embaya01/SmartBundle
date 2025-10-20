import { describe, expect, it } from 'vitest';
import { runSearch, levenshtein } from '../src/search';
import type { Bundle } from '../src/types';

const buildBundle = (overrides: Partial<Bundle>): Bundle => ({
  id: 'default',
  name: 'Generic Bundle',
  services: ['Service A'],
  price: 10,
  currency: 'USD',
  billingCycle: 'mo',
  regions: ['US'],
  provider: 'Provider',
  link: 'https://example.com/deal',
  tags: [],
  isActive: true,
  ...overrides,
});

const sampleBundles: Bundle[] = [
  buildBundle({
    id: 'spotify-hulu',
    name: 'Spotify Premium Student + Hulu',
    services: ['Spotify', 'Hulu'],
    price: 9.99,
    provider: 'Spotify',
    tags: ['student', 'music'],
  }),
  buildBundle({
    id: 'disney-bundle',
    name: 'Disney Bundle: Disney+ + Hulu + ESPN+',
    services: ['Disney+', 'Hulu', 'ESPN+'],
    price: 14.99,
    provider: 'Disney',
    tags: ['family'],
  }),
  buildBundle({
    id: 'tmobile-netflix',
    name: 'T-Mobile Go5G Next + Netflix On Us',
    services: ['T-Mobile 5G', 'Netflix'],
    price: 50,
    provider: 'T-Mobile',
    tags: ['carrier', 'wireless'],
  }),
];

describe('runSearch', () => {
  it('prioritizes prefix matches for search queries', () => {
    const { items } = runSearch(sampleBundles, { q: 'spotify' });
    expect(items[0]?.id).toBe('spotify-hulu');
  });

  it('applies filters with AND logic', () => {
    const { items, total } = runSearch(sampleBundles, {
      q: 'bundle',
      providers: ['Disney'],
      tags: ['family'],
    });

    expect(total).toBe(1);
    expect(items.map((bundle) => bundle.id)).toEqual(['disney-bundle']);
  });

  it('supports price range filters', () => {
    const { items, total } = runSearch(sampleBundles, {
      priceMin: 12,
      priceMax: 20,
    });

    expect(total).toBe(1);
    expect(items[0]?.id).toBe('disney-bundle');
  });

  it('excludes inactive bundles', () => {
    const { items } = runSearch(
      [
        ...sampleBundles,
        buildBundle({
          id: 'inactive-deal',
          name: 'Inactive Bundle Deal',
          services: ['Ghost Service'],
          isActive: false,
        }),
      ],
      { q: 'bundle' },
    );

    expect(items.some((bundle) => bundle.id === 'inactive-deal')).toBe(false);
  });
});

describe('levenshtein', () => {
  it('calculates edit distance between strings', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('bundle', 'bundle')).toBe(0);
    expect(levenshtein('', 'deal')).toBe(4);
  });
});

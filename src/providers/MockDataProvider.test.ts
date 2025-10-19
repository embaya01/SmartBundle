import { describe, expect, it } from 'vitest';
import { MockDataProvider } from './MockDataProvider';
import type { Bundle } from '../types';

const sampleBundles: Bundle[] = [
  {
    id: 'bundle-1',
    name: 'Bundle One',
    services: ['Service A', 'Service B'],
    price: 10,
    currency: 'USD',
    billingCycle: 'mo',
    regions: ['US'],
    provider: 'Provider A',
    link: 'https://example.com/a',
    tags: ['tag-a'],
    isActive: true,
  },
  {
    id: 'bundle-2',
    name: 'Bundle Two',
    services: ['Service C'],
    price: 20,
    currency: 'USD',
    billingCycle: 'mo',
    regions: ['CA'],
    provider: 'Provider B',
    link: 'https://example.com/b',
    tags: ['tag-b'],
    isActive: false,
  },
];

describe('MockDataProvider', () => {
  it('validates bundles on load and exposes facets', async () => {
    const provider = new MockDataProvider([
      ...sampleBundles,
      {
        id: 'invalid',
        name: 'Invalid Bundle',
        services: [],
        price: -5,
        currency: 'USD',
        billingCycle: 'mo',
        regions: [],
        provider: 'Provider',
        link: 'not-a-url',
        tags: [],
        isActive: true,
      } as unknown as Bundle,
    ]);

    const facets = await provider.listFacets();

    expect(facets.regions).toEqual(['US']);
    expect(facets.providers).toEqual(['Provider A']);
    expect(facets.price).toEqual({ min: 10, max: 10 });
  });

  it('returns only active bundles when listing', async () => {
    const provider = new MockDataProvider(sampleBundles);

    const { items } = await provider.listBundles({ q: 'bundle' });

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('bundle-1');
  });
});

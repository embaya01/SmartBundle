import { describe, expect, it } from 'vitest';
import { validateBundles, bundleSchema } from '../src/validation';
import type { Bundle } from '../src/types';

describe('bundleSchema', () => {
  it('rejects negative prices', () => {
    const result = bundleSchema.safeParse({
      id: 'bad-price',
      name: 'Invalid Price Bundle',
      services: ['Service'],
      price: -1,
      currency: 'USD',
      billingCycle: 'mo',
      regions: ['US'],
      provider: 'Provider',
      link: 'https://example.com',
      tags: [],
      isActive: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-http links', () => {
    const result = bundleSchema.safeParse({
      id: 'bad-link',
      name: 'Invalid Link Bundle',
      services: ['Service'],
      price: 9.99,
      currency: 'USD',
      billingCycle: 'mo',
      regions: ['US'],
      provider: 'Provider',
      link: 'ftp://example.com',
      tags: [],
      isActive: true,
    });

    expect(result.success).toBe(false);
  });
});

describe('validateBundles', () => {
  it('filters out invalid records and preserves valid ones', () => {
    const bundles: unknown[] = [
      {
        id: 'valid',
        name: 'Valid Bundle',
        services: ['Service'],
        price: 5,
        currency: 'USD',
        billingCycle: 'mo',
        regions: ['US'],
        provider: 'Provider',
        link: 'https://example.com',
        tags: [],
        isActive: true,
      },
      {
        id: 'invalid-price',
        name: 'Invalid Price',
        services: ['Service'],
        price: -1,
        currency: 'USD',
        billingCycle: 'mo',
        regions: ['US'],
        provider: 'Provider',
        link: 'https://example.com',
        tags: [],
        isActive: true,
      },
    ];

    const result = validateBundles(bundles);

    expect(result).toHaveLength(1);
    expect((result[0] as Bundle).id).toBe('valid');
  });
});

import { describe, expect, it } from 'vitest';
import {
  canonicalizeServiceName,
  uniqueCanonicalServices,
  formatCurrency,
  formatPrice,
  normalizeSearchText,
} from '../src/normalizers';

describe('normalizers', () => {
  it('deduplicates services using canonical names', () => {
    const services = uniqueCanonicalServices(['disney plus', 'Disney+', 'Hulu', 'Hulu']);
    expect(services).toEqual(['Disney+', 'Hulu']);
  });

  it('canonicalizes known service aliases', () => {
    expect(canonicalizeServiceName('apple tv')).toBe('Apple TV+');
    expect(canonicalizeServiceName('espn+')).toBe('ESPN+');
  });

  it('formats currency respecting locale defaults', () => {
    expect(formatCurrency(9.99, 'USD', 'en-US')).toBe('$9.99');
    expect(formatCurrency(25, 'USD', 'en-US')).toBe('$25');
  });

  it('formats price strings with billing cycle and currency', () => {
    const formatted = formatPrice({ price: 14.99, currency: 'USD', billingCycle: 'mo' });
    expect(formatted).toBe('$14.99/mo USD');
  });

  it('normalizes search text to lowercase without surrounding whitespace', () => {
    expect(normalizeSearchText('  Hulu ')).toBe('hulu');
  });
});

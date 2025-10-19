import type { Bundle, CurrencyCode } from '../types';

const serviceAliases: Record<string, string> = {
  'disney plus': 'Disney+',
  'disney+': 'Disney+',
  spotify: 'Spotify',
  hulu: 'Hulu',
  espn: 'ESPN+',
  'espn+': 'ESPN+',
  'apple tv': 'Apple TV+',
  'apple tv+': 'Apple TV+',
};

const currencyLocaleFallback: Record<CurrencyCode, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

export function canonicalizeServiceName(value: string): string {
  const key = value.trim().toLowerCase();
  return serviceAliases[key] ?? value.trim();
}

export function uniqueCanonicalServices(services: string[]): string[] {
  const deduped = new Set<string>();

  services.forEach((service) => deduped.add(canonicalizeServiceName(service)));

  return Array.from(deduped);
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  locale?: string,
): string {
  const formatter = new Intl.NumberFormat(
    locale ?? currencyLocaleFallback[currency] ?? 'en-US',
    {
      style: 'currency',
      currency,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    },
  );

  return formatter.format(amount);
}

export function formatPrice(bundle: Pick<Bundle, 'price' | 'currency' | 'billingCycle'>, locale?: string): string {
  const formatted = formatCurrency(bundle.price, bundle.currency, locale);
  return `${formatted}/${bundle.billingCycle} ${bundle.currency}`;
}

export function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

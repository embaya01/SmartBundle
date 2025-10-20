import type { Bundle } from '../types';
import type { BundleSearchParams } from '../types';
import { normalizeSearchText, uniqueCanonicalServices } from '../normalizers';

interface ScoredBundle {
  bundle: Bundle;
  score: number;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[m][n];
}

function computeScore(bundle: Bundle, query: string): number {
  const normalizedQuery = normalizeSearchText(query);

  const haystacks = [
    bundle.name,
    bundle.provider,
    ...uniqueCanonicalServices(bundle.services),
  ];

  let bestScore = 0;

  for (const haystack of haystacks) {
    const value = normalizeSearchText(haystack);
    if (!value) continue;

    if (value.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 100 - value.indexOf(normalizedQuery));
      continue;
    }

    const containsIndex = value.indexOf(normalizedQuery);
    if (containsIndex >= 0) {
      bestScore = Math.max(bestScore, 70 - containsIndex);
      continue;
    }

    const tokens = value.split(/\s+/);
    let closest = Number.POSITIVE_INFINITY;
    tokens.forEach((token) => {
      closest = Math.min(closest, levenshtein(normalizedQuery, token));
    });

    if (closest < normalizedQuery.length) {
      const fuzzyScore = 60 - closest * 5;
      bestScore = Math.max(bestScore, fuzzyScore);
    }
  }

  return bestScore;
}

function passesFilters(bundle: Bundle, params: BundleSearchParams): boolean {
  if (typeof params.priceMin === 'number' && bundle.price < params.priceMin) {
    return false;
  }

  if (typeof params.priceMax === 'number' && bundle.price > params.priceMax) {
    return false;
  }

  if (params.regions?.length) {
    const matchesRegion = params.regions.some((region) =>
      bundle.regions.map(normalizeSearchText).includes(normalizeSearchText(region)),
    );
    if (!matchesRegion) return false;
  }

  if (params.providers?.length) {
    const matchesProvider = params.providers
      .map(normalizeSearchText)
      .includes(normalizeSearchText(bundle.provider));
    if (!matchesProvider) return false;
  }

  if (params.tags?.length) {
    const normalizedTags = bundle.tags.map(normalizeSearchText);
    const matchesTags = params.tags.some((tag) =>
      normalizedTags.includes(normalizeSearchText(tag)),
    );
    if (!matchesTags) return false;
  }

  return true;
}

export function runSearch(
  source: Bundle[],
  params: BundleSearchParams,
): { items: Bundle[]; total: number } {
  const scored: ScoredBundle[] = [];
  const query = params.q?.trim();

  for (const bundle of source) {
    if (!bundle.isActive) continue;
    if (!passesFilters(bundle, params)) continue;

    const score = query ? computeScore(bundle, query) : 0;
    if (query && score <= 0) continue;

    scored.push({ bundle, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.bundle.name.localeCompare(b.bundle.name);
  });

  const total = scored.length;
  const offset = Math.max(0, params.offset ?? 0);
  const limit = params.limit ?? total;
  const sliceEnd = typeof limit === 'number' ? offset + Math.max(0, limit) : undefined;

  const items = scored.slice(offset, sliceEnd).map((item) => item.bundle);

  return { items, total };
}

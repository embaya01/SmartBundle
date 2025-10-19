import type { ChangeEvent } from 'react';
import type { FacetSummary } from '../providers/DataProvider';

export interface FiltersState {
  priceMin?: number;
  priceMax?: number;
  regions: string[];
  providers: string[];
  tags: string[];
}

export interface FilterCounts {
  regions: Record<string, number>;
  providers: Record<string, number>;
  tags: Record<string, number>;
}

interface FiltersProps {
  facets: FacetSummary | null;
  value: FiltersState;
  counts: FilterCounts;
  onChange: (next: FiltersState) => void;
  disabled?: boolean;
}

const toggleValue = (values: string[], target: string): string[] => {
  if (values.includes(target)) {
    return values.filter((value) => value !== target);
  }

  return [...values, target];
};

const parseNumber = (value: string): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const Filters = ({ facets, value, counts, onChange, disabled = false }: FiltersProps) => {
  const handlePriceMinChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      priceMin: parseNumber(event.target.value),
    });
  };

  const handlePriceMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      priceMax: parseNumber(event.target.value),
    });
  };

  const handleToggle = (key: keyof FiltersState, option: string) => {
    onChange({
      ...value,
      [key]: toggleValue(value[key] as string[], option),
    });
  };

  const handleClear = () => {
    onChange({
      priceMin: undefined,
      priceMax: undefined,
      regions: [],
      providers: [],
      tags: [],
    });
  };

  const disableMultiSelect = disabled || !facets;

  return (
    <aside className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-semibold text-brand-600 transition hover:text-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Reset
        </button>
      </header>

      <section aria-label="Price filter" className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Price</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Min
            <input
              type="number"
              inputMode="decimal"
              min={facets?.price.min}
              max={facets?.price.max}
              value={value.priceMin ?? ''}
              onChange={handlePriceMinChange}
              placeholder={facets ? String(facets.price.min) : '0'}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Max
            <input
              type="number"
              inputMode="decimal"
              min={facets?.price.min}
              max={facets?.price.max}
              value={value.priceMax ?? ''}
              onChange={handlePriceMaxChange}
              placeholder={facets ? String(facets.price.max) : '0'}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            />
          </label>
        </div>
      </section>

      <section aria-label="Regions filter" className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Regions</h3>
        <div className="flex flex-wrap gap-2">
          {facets?.regions.map((region) => (
            <label
              key={region}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 ${value.regions.includes(region) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
            >
              <input
                type="checkbox"
                value={region}
                checked={value.regions.includes(region)}
                onChange={() => handleToggle('regions', region)}
                disabled={disableMultiSelect}
                className="sr-only"
              />
              <span>{region}</span>
              <span className="text-[0.65rem] font-medium text-slate-400">
                {counts.regions[region] ?? 0}
              </span>
            </label>
          ))}
          {!facets?.regions.length ? (
            <span className="text-xs text-slate-400">No regions available</span>
          ) : null}
        </div>
      </section>

      <section aria-label="Providers filter" className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Providers</h3>
        <div className="flex flex-wrap gap-2">
          {facets?.providers.map((provider) => (
            <label
              key={provider}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 ${value.providers.includes(provider) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
            >
              <input
                type="checkbox"
                value={provider}
                checked={value.providers.includes(provider)}
                onChange={() => handleToggle('providers', provider)}
                disabled={disableMultiSelect}
                className="sr-only"
              />
              <span>{provider}</span>
              <span className="text-[0.65rem] font-medium text-slate-400">
                {counts.providers[provider] ?? 0}
              </span>
            </label>
          ))}
          {!facets?.providers.length ? (
            <span className="text-xs text-slate-400">No providers available</span>
          ) : null}
        </div>
      </section>

      <section aria-label="Tags filter" className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {facets?.tags.map((tag) => (
            <label
              key={tag}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 ${value.tags.includes(tag) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}`}
            >
              <input
                type="checkbox"
                value={tag}
                checked={value.tags.includes(tag)}
                onChange={() => handleToggle('tags', tag)}
                disabled={disableMultiSelect}
                className="sr-only"
              />
              <span>{tag}</span>
              <span className="text-[0.65rem] font-medium text-slate-400">
                {counts.tags[tag] ?? 0}
              </span>
            </label>
          ))}
          {!facets?.tags.length ? (
            <span className="text-xs text-slate-400">No tags available</span>
          ) : null}
        </div>
      </section>
    </aside>
  );
};

export default Filters;

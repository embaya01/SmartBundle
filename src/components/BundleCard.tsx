import type { KeyboardEvent, MouseEvent } from 'react';
import type { Bundle } from '../types';
import { formatPrice } from '../lib/normalizers';

interface BundleCardProps {
  bundle: Bundle;
  onSelect: (bundle: Bundle) => void;
  onViewDeal?: (bundle: Bundle) => void;
}

const BundleCard = ({ bundle, onSelect, onViewDeal }: BundleCardProps) => {
  const handleSelect = () => onSelect(bundle);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(bundle);
    }
  };

  const handleViewDeal = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    onViewDeal?.(bundle);
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`View details for ${bundle.name}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{bundle.name}</h3>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          {formatPrice(bundle)}
        </span>
      </div>

      <p className="text-sm text-slate-500">
        Provider: <span className="font-medium text-slate-900">{bundle.provider}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {bundle.services.map((service) => (
          <span
            key={service}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            {service}
          </span>
        ))}
      </div>

      {bundle.tags.length ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {bundle.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-900/5 px-3 py-1 font-medium uppercase tracking-wide text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">
          Regions: {bundle.regions.join(', ')}
        </span>
        {bundle.billingCycle === 'yr' ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">Annual</span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">Monthly</span>
        )}
        {bundle.source ? (
          <span className="rounded-full bg-slate-100 px-2 py-1 font-medium capitalize">
            {bundle.source}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(bundle);
          }}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          View Details
        </button>
        <a
          href={bundle.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleViewDeal}
          className="rounded-full border border-brand-200 px-5 py-2 text-sm font-semibold text-brand-600 transition hover:border-brand-500 hover:text-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          View Deal
        </a>
      </div>
    </article>
  );
};

export default BundleCard;

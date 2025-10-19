import type { Bundle } from '../types';
import BundleCard from './BundleCard';

interface BundleGridProps {
  bundles: Bundle[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelect: (bundle: Bundle) => void;
  onViewDeal?: (bundle: Bundle) => void;
}

const BundleGrid = ({
  bundles,
  total,
  page,
  pageSize,
  onPageChange,
  onSelect,
  onViewDeal,
}: BundleGridProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = total === 0 ? 0 : Math.min(total, startItem + bundles.length - 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map((bundle) => (
          <BundleCard
            key={bundle.id}
            bundle={bundle}
            onSelect={onSelect}
            onViewDeal={onViewDeal}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-soft">
        <p>
          Showing <span className="font-semibold text-slate-900">{startItem}</span>
          {total > 0 ? (
            <>
              {' - '}
              <span className="font-semibold text-slate-900">{endItem}</span>
            </>
          ) : null}{' '}
          of <span className="font-semibold text-slate-900">{total}</span> bundles
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={page <= 1}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="font-medium text-slate-900">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={page >= totalPages}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BundleGrid;

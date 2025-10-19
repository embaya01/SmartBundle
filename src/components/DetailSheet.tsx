import { useEffect, useMemo, useRef } from 'react';
import type { MouseEvent } from 'react';
import type { Bundle } from '../types';
import { formatPrice } from '../lib/normalizers';

interface DetailSheetProps {
  bundle: Bundle | null;
  open: boolean;
  onClose: () => void;
  onViewDeal?: (bundle: Bundle) => void;
}

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

const DetailSheet = ({ bundle, open, onClose, onViewDeal }: DetailSheetProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  const formattedDate = useMemo(() => formatDate(bundle?.lastVerified), [bundle?.lastVerified]);

  if (!bundle || !open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 sm:items-center"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bundle-detail-title"
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500"
      >
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="bundle-detail-title" className="text-2xl font-semibold text-slate-900">
              {bundle.name}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Provided by{' '}
              <span className="font-semibold text-slate-900">{bundle.provider}</span>{' '}
              {bundle.source ? <span className="capitalize text-slate-400">({bundle.source})</span> : null}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Close
          </button>
        </header>

        <section className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-brand-50 px-4 py-1 font-semibold text-brand-700">
            {formatPrice(bundle)}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Billing cycle: {bundle.billingCycle === 'yr' ? 'Annual' : 'Monthly'}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            Regions: {bundle.regions.join(', ')}
          </span>
          {formattedDate ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              Last verified: {formattedDate}
            </span>
          ) : null}
        </section>

        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Services</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {bundle.services.map((service) => (
              <span
                key={service}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
              >
                {service}
              </span>
            ))}
          </div>
        </section>

        {bundle.tags.length ? (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {bundle.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {bundle.summary ? (
          <section className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{bundle.summary}</p>
          </section>
        ) : null}

        <footer className="mt-8 flex flex-wrap gap-3">
          <a
            href={bundle.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onViewDeal?.(bundle)}
            className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            View Deal
          </a>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DetailSheet;

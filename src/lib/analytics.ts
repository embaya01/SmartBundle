import type { Bundle } from '../types';
import type { AnalyticsEvent, AnalyticsProvider } from '../providers/AnalyticsProvider';
import { ConsoleAnalyticsProvider, RestAnalyticsProvider } from '../providers/AnalyticsProvider';

declare global {
  interface Window {
    dataLayer?: AnalyticsEvent[];
  }
}

const resolveDefaultProvider = (): AnalyticsProvider => {
  const endpoint = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_ANALYTICS_ENDPOINT : undefined;
  if (endpoint) {
    return new RestAnalyticsProvider(endpoint);
  }
  return new ConsoleAnalyticsProvider();
};

let provider: AnalyticsProvider = resolveDefaultProvider();

export const setAnalyticsProvider = (nextProvider: AnalyticsProvider) => {
  provider = nextProvider;
};

const dispatchEvent = (event: AnalyticsEvent) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push(event);
  }

  void provider.track(event);
};

export const trackViewDeal = (bundle: Bundle) => {
  const event: AnalyticsEvent = {
    event: 'view_deal',
    timestamp: new Date().toISOString(),
    payload: {
      id: bundle.id,
      name: bundle.name,
      provider: bundle.provider,
      price: bundle.price,
      currency: bundle.currency,
      billingCycle: bundle.billingCycle,
      link: bundle.link,
    },
  };

  dispatchEvent(event);
};

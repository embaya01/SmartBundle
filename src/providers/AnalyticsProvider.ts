export interface AnalyticsEvent {
  event: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
}

export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent): void {
    console.info('[SmartBundle][analytics]', event);
  }
}

export class RestAnalyticsProvider implements AnalyticsProvider {
  private readonly endpoint: string;

  constructor(endpoint: string = '/api/events') {
    this.endpoint = endpoint;
  }

  async track(event: AnalyticsEvent): Promise<void> {
    const body = JSON.stringify(event);

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const dispatched = navigator.sendBeacon(this.endpoint, body);
      if (dispatched) return;
    }

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      });
    } catch (error) {
      console.warn('[SmartBundle][analytics] Failed to send analytics event', error);
    }
  }
}

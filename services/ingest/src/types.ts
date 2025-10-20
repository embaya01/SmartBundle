import type { Logger } from './logger';
import type { Bundle } from '@smartbundle/shared/types';

export interface ScrapeContext {
  logger: Logger;
  runId: string;
  source: string;
  options: Record<string, unknown>;
  request: typeof fetch;
}

export interface NormalizedBundle extends Bundle {
  rawPayload?: unknown;
}

export interface IngestionJobData {
  source: string;
  options?: Record<string, unknown>;
  runId?: string;
}

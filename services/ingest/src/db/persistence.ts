import { createHash } from 'node:crypto';
import type { Bundle } from '@smartbundle/shared/types';
import { BundleBillingCycle, BundleSource as DbBundleSource, Prisma } from '@prisma/client';
import { logger } from '../logger';
import { prisma } from './prisma';

export interface PersistBundlesOptions {
  runId: string;
  source: string;
  bundles: Bundle[];
}

export interface PersistResult {
  created: number;
  updated: number;
  skipped: number;
  history: number;
  deactivated: number;
  upserts: number;
}

const ALLOWED_SOURCES = new Set<DbBundleSource>(Object.values(DbBundleSource));

const DB_DISABLED_RESULT: PersistResult = {
  created: 0,
  updated: 0,
  skipped: 0,
  history: 0,
  deactivated: 0,
  upserts: 0,
};

function computeDataHash(payload: object): string {
  const str = JSON.stringify(payload);
  return createHash('sha256').update(str).digest('hex');
}

function toBillingCycle(cycle: Bundle['billingCycle']): BundleBillingCycle {
  return cycle === 'yr' ? 'yr' : 'mo';
}

function toPriceCents(price: number): number {
  return Math.round(price * 100);
}

function toTimestamp(value?: string): Date {
  return value ? new Date(value) : new Date();
}

function coerceSource(value?: string | null): DbBundleSource | null {
  if (!value) return null;
  const normalized = value as DbBundleSource;
  return ALLOWED_SOURCES.has(normalized) ? normalized : null;
}

export async function persistBundles({ bundles, runId, source }: PersistBundlesOptions): Promise<PersistResult> {
  if (!process.env.DATABASE_URL) {
    if (bundles.length) {
      logger.warn({ source, runId }, 'DATABASE_URL not set; skipping bundle persistence');
    }
    return { ...DB_DISABLED_RESULT, skipped: bundles.length };
  }

  if (!bundles.length) {
    return { ...DB_DISABLED_RESULT };
  }

  return prisma.$transaction(async (tx) => {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let historyRecords = 0;
    let deactivated = 0;

    const processedIds = new Set<string>();

    for (const bundle of bundles) {
      processedIds.add(bundle.id);

      const priceCents = toPriceCents(bundle.price);
      const billingCycle = toBillingCycle(bundle.billingCycle);
      const lastVerifiedAt = toTimestamp(bundle.lastVerified);
      const normalizedSource = coerceSource(bundle.source ?? source ?? null);
      const dataHash = computeDataHash({
        name: bundle.name,
        services: bundle.services,
        priceCents,
        currency: bundle.currency,
        billingCycle,
        regions: bundle.regions,
        provider: bundle.provider,
        link: bundle.link,
        tags: bundle.tags,
        summary: bundle.summary ?? '',
        isActive: bundle.isActive,
        source: normalizedSource,
      });

      const existing = await tx.bundle.findUnique({
        where: { id: bundle.id },
        select: {
          id: true,
          priceCents: true,
          currency: true,
          billingCycle: true,
          dataHash: true,
          isActive: true,
          source: true,
        },
      });

      const baseData = {
        name: bundle.name,
        services: bundle.services,
        priceCents,
        currency: bundle.currency,
        billingCycle,
        regions: bundle.regions,
        provider: bundle.provider,
        link: bundle.link,
        tags: bundle.tags,
        summary: bundle.summary,
        isActive: bundle.isActive,
        lastVerifiedAt,
        source: normalizedSource,
        dataHash,
        confidence: bundle.scrapeMeta?.confidence ?? null,
        rawPayload: bundle.scrapeMeta ?? Prisma.JsonNull,
      };

      if (!existing) {
        await tx.bundle.create({
          data: {
            id: bundle.id,
            ...baseData,
          },
        });
        await tx.bundleHistory.create({
          data: {
            bundleId: bundle.id,
            capturedAt: lastVerifiedAt,
            priceCents,
            currency: bundle.currency,
            billingCycle,
          },
        });
        created += 1;
        historyRecords += 1;
        continue;
      }

      if (existing.dataHash === dataHash) {
        skipped += 1;
        continue;
      }

      await tx.bundle.update({
        where: { id: bundle.id },
        data: baseData,
      });
      updated += 1;

      if (
        existing.priceCents !== priceCents ||
        existing.currency !== bundle.currency ||
        existing.billingCycle !== billingCycle
      ) {
        await tx.bundleHistory.create({
          data: {
            bundleId: bundle.id,
            capturedAt: lastVerifiedAt,
            priceCents,
            currency: bundle.currency,
            billingCycle,
          },
        });
        historyRecords += 1;
      }
    }

    const sourceForDeactivation = coerceSource(source ?? null);
    if (processedIds.size && sourceForDeactivation) {
      const inactiveResult = await tx.bundle.updateMany({
        where: {
          source: sourceForDeactivation,
          id: { notIn: Array.from(processedIds) },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      deactivated = inactiveResult.count;
    }

    return {
      created,
      updated,
      skipped,
      history: historyRecords,
      deactivated,
      upserts: created + updated,
    };
  });
}


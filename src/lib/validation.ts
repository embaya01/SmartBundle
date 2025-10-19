import { z } from 'zod';
import type { Bundle } from '../types';

const httpRegex = /^https?:\/\//i;

const nonEmptyString = z.string().trim().min(1);

export const bundleSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  services: z.array(nonEmptyString).min(1),
  price: z.number().min(0),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  billingCycle: z.enum(['mo', 'yr']).default('mo'),
  regions: z.array(nonEmptyString).min(1),
  provider: nonEmptyString,
  link: z
    .string()
    .url()
    .refine((value) => httpRegex.test(value), {
      message: 'Link must be http(s)',
    }),
  tags: z.array(nonEmptyString).default([]),
  summary: nonEmptyString.optional(),
  isActive: z.boolean(),
  lastVerified: z.string().datetime().optional(),
  source: z.enum(['official', 'carrier', 'partner', 'aggregator']).optional(),
});

export function validateBundles(raw: unknown): Bundle[] {
  if (!Array.isArray(raw)) {
    console.warn('[SmartBundle] Expected bundle data to be an array.');
    return [];
  }

  const bundles: Bundle[] = [];

  raw.forEach((item, index) => {
    const result = bundleSchema.safeParse(item);

    if (!result.success) {
      console.warn(
        `[SmartBundle] Dropping invalid bundle at index ${index}:`,
        result.error.flatten().fieldErrors,
      );
      return;
    }

    bundles.push(result.data);
  });

  return bundles;
}

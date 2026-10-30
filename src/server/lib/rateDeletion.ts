import type { PlanRate } from './rateChanges.ts';

export type DeletionRate = PlanRate & { replacedRateId: number | null };

export type RateDeletionOutcome =
  'inactive' | 'restores' | 'otherActiveRemains' | 'leavesScopeEmpty';

export type RateDeletionPlan = {
  rateId: number;
  outcome: RateDeletionOutcome;
  restoreRateId: number | null;
};

export type RateDeletionErrorCode = 'RATE_NOT_FOUND' | 'HAS_LOGS';

export class RateDeletionError extends Error {
  code: RateDeletionErrorCode;

  constructor(code: RateDeletionErrorCode) {
    super(code);
    this.name = 'RateDeletionError';
    this.code = code;
  }
}

/**
 * Rates created before `replacedRateId` existed: the rate they replaced was
 * deactivated in the same transaction, so its `updatedAt` lands this close to
 * the new rate's `createdAt`.
 */
export const REPLACEMENT_WINDOW_MS = 5_000;

// Dates may arrive serialized as strings
const time = (value: Date | string) => new Date(value).getTime();

const sameScope = (a: DeletionRate, b: DeletionRate) =>
  a.siteId === b.siteId && (a.userId ?? null) === (b.userId ?? null);

/**
 * Decides which rate becomes vigente again when `siteRateId` is deleted.
 * `rates` must be all of the site's; the preview and the delete both call this.
 */
export function planRateDeletion({
  siteRateId,
  rates,
  logsCount,
}: {
  siteRateId: number;
  rates: DeletionRate[];
  logsCount: number;
}): RateDeletionPlan {
  const rate = rates.find((r) => r.id === siteRateId);
  if (!rate) throw new RateDeletionError('RATE_NOT_FOUND');
  if (logsCount > 0) throw new RateDeletionError('HAS_LOGS');

  const plan = (
    outcome: RateDeletionOutcome,
    restoreRateId: number | null = null,
  ): RateDeletionPlan => ({ rateId: rate.id, outcome, restoreRateId });

  if (!rate.active) return plan('inactive');

  const others = rates.filter((r) => r.id !== rate.id && sameScope(r, rate));
  if (others.some((r) => r.active)) return plan('otherActiveRemains');

  const inactive = others.filter((r) => !r.active);
  const candidate =
    inactive.find((r) => r.id === rate.replacedRateId) ??
    inactive
      .filter(
        (r) =>
          Math.abs(time(r.updatedAt) - time(rate.createdAt)) <=
          REPLACEMENT_WINDOW_MS,
      )
      .sort((a, b) => time(b.createdAt) - time(a.createdAt))[0];

  return candidate ? plan('restores', candidate.id) : plan('leavesScopeEmpty');
}

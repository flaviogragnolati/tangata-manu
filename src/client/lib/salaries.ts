import {
  comparePeriods,
  isSamePeriod,
  previousPeriod,
  type Period,
} from './period.ts';
import { resolveApplicableRate, type RateLike } from './siteRates.ts';

type RateValuesLike = {
  normalRate: number | null;
  saturdayPreRate: number | null;
  saturdayPostRate: number | null;
};

export type RateValues = {
  normalRate: number;
  saturdayPreRate: number;
  saturdayPostRate: number;
};

/** Rounded % change; null when there is no previous amount to compare with. */
export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** % change of `totalAmount` against the previous period, per key and overall. */
export function amountDeltas(
  userSalaries: {
    userId: string;
    siteId: string;
    year: number;
    month: number;
    totalAmount: number;
  }[],
  groupBy: 'userId' | 'siteId',
  period: Period,
): { byKey: Record<string, number | null>; total: number | null } {
  const previous = previousPeriod(period);
  const current: Record<string, number> = {};
  const before: Record<string, number> = {};
  let currentTotal = 0;
  let previousTotal = 0;

  for (const salary of userSalaries) {
    const key = salary[groupBy];
    if (isSamePeriod(salary, period)) {
      current[key] = (current[key] ?? 0) + salary.totalAmount;
      currentTotal += salary.totalAmount;
    } else if (isSamePeriod(salary, previous)) {
      before[key] = (before[key] ?? 0) + salary.totalAmount;
      previousTotal += salary.totalAmount;
    }
  }

  const byKey: Record<string, number | null> = {};
  for (const [key, amount] of Object.entries(current)) {
    byKey[key] = pctChange(amount, before[key] ?? 0);
  }
  return { byKey, total: pctChange(currentTotal, previousTotal) };
}

const rateValues = (rate: RateValuesLike | null): RateValues => ({
  normalRate: rate?.normalRate ?? 0,
  saturdayPreRate: rate?.saturdayPreRate ?? 0,
  saturdayPostRate: rate?.saturdayPostRate ?? 0,
});

export const userSiteKey = (userId: string, siteId: number | string) =>
  `${userId}:${siteId}`;

/**
 * Values of the Tarifa aplicada of each user's newest log per site, keyed by
 * `userSiteKey`. Uses only the logs it receives.
 */
export function latestRateByUserSite(
  logs: {
    userId: string;
    year: number;
    month: number;
    SiteRate: RateValuesLike & { siteId: number };
  }[],
): Map<string, RateValues> {
  const latest = new Map<string, { period: Period; rate: RateValues }>();
  for (const log of logs) {
    const key = userSiteKey(log.userId, log.SiteRate.siteId);
    const current = latest.get(key);
    if (!current || comparePeriods(log, current.period) > 0) {
      latest.set(key, {
        period: { year: log.year, month: log.month },
        rate: rateValues(log.SiteRate),
      });
    }
  }
  return new Map([...latest].map(([key, { rate }]) => [key, rate]));
}

/**
 * Rate that values a user's Aguinaldo in a site: the Tarifa aplicable, except
 * for a user dado de baja, whose user rates the baja deactivated; their newest
 * log's Tarifa aplicada stands in for it.
 */
export function extraSalaryRate({
  userId,
  siteId,
  lastRate,
  deactivatedUserIds,
  activeRates,
}: {
  userId: string;
  siteId: number;
  lastRate: RateValuesLike | null;
  deactivatedUserIds: Set<string>;
  activeRates: RateLike[];
}): RateValues {
  if (deactivatedUserIds.has(userId) && lastRate) return rateValues(lastRate);
  return rateValues(resolveApplicableRate(activeRates, siteId, userId));
}

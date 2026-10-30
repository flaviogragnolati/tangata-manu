import { isSamePeriod, previousPeriod, type Period } from './period.ts';

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

import { comparePeriods, type Period } from './period.ts';

export function latestPeriodByUser(
  logs: { userId: string; year: number; month: number }[],
): Map<string, Period> {
  const latest = new Map<string, Period>();
  for (const { userId, year, month } of logs) {
    const current = latest.get(userId);
    if (!current || comparePeriods({ year, month }, current) > 0) {
      latest.set(userId, { year, month });
    }
  }
  return latest;
}

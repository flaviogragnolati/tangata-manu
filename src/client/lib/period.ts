/** A calendar month; `month` is 0–11, like `dayjs().month()` and the DB. */
export type Period = { year: number; month: number };

export const DEFAULT_TIME_ZONE = 'America/Argentina/Buenos_Aires';

/** The server runs in UTC, so "now" must be read in the users' time zone. */
export function currentPeriod(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): Period {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const part = (type: 'year' | 'month') =>
    Number(parts.find((p) => p.type === type)?.value);

  return { year: part('year'), month: part('month') - 1 };
}

export function previousPeriod({ year, month }: Period): Period {
  return month === 0
    ? { year: year - 1, month: 11 }
    : { year, month: month - 1 };
}

export function nextPeriod({ year, month }: Period): Period {
  return month === 11
    ? { year: year + 1, month: 0 }
    : { year, month: month + 1 };
}

export function comparePeriods(a: Period, b: Period): number {
  return a.year - b.year || a.month - b.month;
}

export function isSamePeriod(a: Period, b: Period): boolean {
  return comparePeriods(a, b) === 0;
}

export function formatPeriod(p: Period, monthNames: readonly string[]): string {
  return `${monthNames[p.month] ?? ''} ${p.year}`;
}

/** Users may load hours for the current month, and for the previous one during the first 5 days. */
export function loadablePeriods(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE,
): Period[] {
  const current = currentPeriod(now, timeZone);
  const day = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone, day: 'numeric' }).format(now),
  );
  return day <= 5 ? [previousPeriod(current), current] : [current];
}

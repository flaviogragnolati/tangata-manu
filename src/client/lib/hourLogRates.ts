import { isSamePeriod, previousPeriod, type Period } from './period.ts';
import { resolveApplicableRate, type RateLike } from './siteRates.ts';

type Person = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export type HourLogLike = {
  id: number;
  userId: string;
  year: number;
  month: number;
  siteRateId: number;
  normalHours: number | null;
  saturdayPreHours: number | null;
  saturdayPostHours: number | null;
  amount: number;
  SiteRate: RateLike & { Site: { id: number; name: string } };
  User?: Person | null;
};

export type RateRow = {
  hourLogId: number;
  siteId: number;
  siteName: string;
  hours: {
    normal: number;
    saturdayPre: number;
    saturdayPost: number;
    total: number;
  };
  amount: number;
  appliedRate: { normal: number; saturdayPre: number; saturdayPost: number };
  scope: 'site' | 'user';
  isOutdated: boolean;
};

export type MonthSummary = {
  period: Period;
  rows: RateRow[];
  totalHours: number;
  totalAmount: number;
};

export type UserRateSummary = Person & {
  userId: string;
  /** [previous period, chosen period] */
  months: [MonthSummary, MonthSummary];
};

/**
 * Tarifa desactualizada: the rate a log was priced with is no longer the
 * Tarifa aplicable for that user and site (or there is none).
 */
export function isOutdatedLog(log: HourLogLike, activeRates: RateLike[]) {
  return (
    resolveApplicableRate(activeRates, log.SiteRate.siteId, log.userId)?.id !==
    log.siteRateId
  );
}

function toRow(log: HourLogLike, activeRates: RateLike[]): RateRow {
  const normal = log.normalHours ?? 0;
  const saturdayPre = log.saturdayPreHours ?? 0;
  const saturdayPost = log.saturdayPostHours ?? 0;
  return {
    hourLogId: log.id,
    siteId: log.SiteRate.siteId,
    siteName: log.SiteRate.Site.name,
    hours: {
      normal,
      saturdayPre,
      saturdayPost,
      total: normal + saturdayPre + saturdayPost,
    },
    amount: log.amount,
    appliedRate: {
      normal: log.SiteRate.normalRate ?? 0,
      saturdayPre: log.SiteRate.saturdayPreRate ?? 0,
      saturdayPost: log.SiteRate.saturdayPostRate ?? 0,
    },
    scope: log.SiteRate.userId ? 'user' : 'site',
    isOutdated: isOutdatedLog(log, activeRates),
  };
}

function summarizeMonth(
  logs: HourLogLike[],
  period: Period,
  activeRates: RateLike[],
): MonthSummary {
  const rows = logs
    .filter((log) => isSamePeriod(log, period))
    .map((log) => toRow(log, activeRates))
    .sort((a, b) => a.siteName.localeCompare(b.siteName, 'es'));
  return {
    period,
    rows,
    totalHours: rows.reduce((acc, row) => acc + row.hours.total, 0),
    totalAmount: rows.reduce((acc, row) => acc + row.amount, 0),
  };
}

export function buildUserRateSummaries({
  hourLogs,
  users,
  activeRates,
  period,
  siteIds = [],
}: {
  hourLogs: HourLogLike[];
  users: ({ id: string } & Person)[];
  activeRates: RateLike[];
  period: Period;
  siteIds?: number[];
}): UserRateSummary[] {
  const previous = previousPeriod(period);
  const logs = hourLogs.filter(
    (log) =>
      (isSamePeriod(log, period) || isSamePeriod(log, previous)) &&
      (!siteIds.length || siteIds.includes(log.SiteRate.siteId)),
  );

  const people = new Map<string, Person>(
    users.map(({ id, name, email, image }) => [id, { name, email, image }]),
  );
  for (const log of logs) {
    if (people.has(log.userId)) continue;
    people.set(log.userId, {
      name: log.User?.name ?? null,
      email: log.User?.email ?? null,
      image: log.User?.image ?? null,
    });
  }

  const summaries: UserRateSummary[] = [];
  for (const [userId, person] of people) {
    const userLogs = logs.filter((log) => log.userId === userId);
    if (siteIds.length && !userLogs.length) continue;
    summaries.push({
      userId,
      ...person,
      months: [
        summarizeMonth(userLogs, previous, activeRates),
        summarizeMonth(userLogs, period, activeRates),
      ],
    });
  }

  const label = (s: UserRateSummary) => s.name ?? s.email ?? '';
  return summaries.sort((a, b) => label(a).localeCompare(label(b), 'es'));
}

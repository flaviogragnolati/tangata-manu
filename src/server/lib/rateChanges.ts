import type {
  RateChangeInput,
  RateValues,
} from '../../schemas/rateChange.schema.ts';
import { comparePeriods, type Period } from '../../client/lib/period.ts';
import type { RateLike } from '../../client/lib/siteRates.ts';

// Imported by client components too: keep this file free of server-only imports.

type HoursLike = {
  normalHours: number | null;
  saturdayPreHours: number | null;
  saturdayPostHours: number | null;
};

type RateValuesLike = {
  normalRate: number | null;
  saturdayPreRate: number | null;
  saturdayPostRate: number | null;
};

/** The only implementation of the rule: monto = horas × valores de la tarifa aplicada. */
export function computeAmount(hours: HoursLike, rate: RateValuesLike): number {
  return (
    (hours.normalHours ?? 0) * (rate.normalRate ?? 0) +
    (hours.saturdayPreHours ?? 0) * (rate.saturdayPreRate ?? 0) +
    (hours.saturdayPostHours ?? 0) * (rate.saturdayPostRate ?? 0)
  );
}

export function totalHours(hours: HoursLike): number {
  return (
    (hours.normalHours ?? 0) +
    (hours.saturdayPreHours ?? 0) +
    (hours.saturdayPostHours ?? 0)
  );
}

/** Amounts are floats; differences under half a cent are noise. */
export function sameAmount(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

export type PlanRate = RateLike & { updatedAt: Date };

export type PlanLog = HoursLike & {
  id: number;
  userId: string;
  year: number;
  month: number;
  siteRateId: number;
  amount: number;
  updatedAt: Date;
};

export type PlanItem = {
  hourLogId: number;
  userId: string;
  period: Period;
  hours: number;
  fromSiteRateId: number;
  fromAmount: number;
  toAmount: number;
};

export type RateChangePlan = {
  deactivateRateIds: number[];
  createRate: {
    siteId: number;
    userId: string | null;
    values: RateValues;
  } | null;
  updateRate: { id: number; values: RateValues } | null;
  targetRateId: number | 'new';
  items: PlanItem[];
  totals: {
    logs: number;
    users: number;
    from: Period | null;
    to: Period | null;
    fromAmount: number;
    toAmount: number;
    touchesPastPeriods: boolean;
  };
  keptOnPreviousRate: number;
  fingerprint: string;
};

export type RateChangeErrorCode =
  | 'RATE_NOT_FOUND'
  | 'NOT_ACTIVE'
  | 'NOT_USER_RATE'
  | 'NO_SITE_RATE'
  | 'NO_CHANGES'
  | 'FUTURE_PERIOD';

export class RateChangeError extends Error {
  code: RateChangeErrorCode;

  constructor(code: RateChangeErrorCode) {
    super(code);
    this.name = 'RateChangeError';
    this.code = code;
  }
}

// Dates may arrive serialized as strings
const time = (value: Date | string) => new Date(value).getTime();

const toValues = (rate: RateValuesLike): RateValues => ({
  normalRate: rate.normalRate ?? 0,
  saturdayPreRate: rate.saturdayPreRate ?? 0,
  saturdayPostRate: rate.saturdayPostRate ?? 0,
});

function sameValues(a: RateValues, b: RateValues) {
  return (
    a.normalRate === b.normalRate &&
    a.saturdayPreRate === b.saturdayPreRate &&
    a.saturdayPostRate === b.saturdayPostRate
  );
}

function newestActiveSiteRate(rates: PlanRate[]) {
  return (
    rates
      .filter((rate) => rate.active && !rate.userId)
      .sort((a, b) => time(b.createdAt) - time(a.createdAt))[0] ?? null
  );
}

const fromPeriod = (log: PlanLog, from: Period) =>
  comparePeriods(log, from) >= 0;

function toItem(log: PlanLog, toAmount: number): PlanItem {
  return {
    hourLogId: log.id,
    userId: log.userId,
    period: { year: log.year, month: log.month },
    hours: totalHours(log),
    fromSiteRateId: log.siteRateId,
    fromAmount: log.amount,
    toAmount,
  };
}

/**
 * Decides which hour logs a rate change rewrites, to which rate and with which
 * amount. `rates` and `logs` must be all of the site's; the preview and the
 * apply both call this so what the admin sees is what gets saved.
 */
export function planRateChange({
  change,
  rates,
  logs,
  now,
}: {
  change: RateChangeInput;
  rates: PlanRate[];
  logs: PlanLog[];
  now: Period;
}): RateChangePlan {
  if (
    change.kind !== 'correct' &&
    change.retroactiveFrom &&
    comparePeriods(change.retroactiveFrom, now) > 0
  ) {
    throw new RateChangeError('FUTURE_PERIOD');
  }

  const rateById = new Map(rates.map((rate) => [rate.id, rate]));
  let deactivateRateIds: number[] = [];
  let createRate: RateChangePlan['createRate'] = null;
  let updateRate: RateChangePlan['updateRate'] = null;
  let targetRateId: RateChangePlan['targetRateId'];
  let items: PlanItem[] = [];

  switch (change.kind) {
    case 'replace': {
      const userId = change.userId ?? null;
      deactivateRateIds = rates
        .filter((rate) => rate.active && (rate.userId ?? null) === userId)
        .map((rate) => rate.id);
      createRate = { siteId: change.siteId, userId, values: change.values };
      targetRateId = 'new';

      const from = change.retroactiveFrom;
      if (from) {
        // A Tarifa del sitio never overrides logs priced with a Tarifa por usuario.
        const inScope = (log: PlanLog) =>
          userId === null
            ? rateById.get(log.siteRateId)?.userId == null
            : log.userId === userId;
        items = logs
          .filter((log) => fromPeriod(log, from) && inScope(log))
          .map((log) => toItem(log, computeAmount(log, change.values)));
      }
      break;
    }
    case 'correct': {
      const rate = rateById.get(change.siteRateId);
      if (!rate) throw new RateChangeError('RATE_NOT_FOUND');
      if (sameValues(toValues(rate), change.values)) {
        throw new RateChangeError('NO_CHANGES');
      }
      updateRate = { id: rate.id, values: change.values };
      targetRateId = rate.id;
      items = logs
        .filter((log) => log.siteRateId === rate.id)
        .map((log) => toItem(log, computeAmount(log, change.values)))
        .filter((item) => !sameAmount(item.fromAmount, item.toAmount));
      break;
    }
    case 'removeUserRate': {
      const rate = rateById.get(change.siteRateId);
      if (!rate) throw new RateChangeError('RATE_NOT_FOUND');
      if (!rate.userId) throw new RateChangeError('NOT_USER_RATE');
      if (!rate.active) throw new RateChangeError('NOT_ACTIVE');
      const siteRate = newestActiveSiteRate(rates);
      if (!siteRate) throw new RateChangeError('NO_SITE_RATE');

      deactivateRateIds = [rate.id];
      targetRateId = siteRate.id;

      const from = change.retroactiveFrom;
      if (from) {
        items = logs
          .filter(
            (log) =>
              log.userId === rate.userId &&
              fromPeriod(log, from) &&
              rateById.get(log.siteRateId)?.userId != null,
          )
          .map((log) => toItem(log, computeAmount(log, siteRate)));
      }
      break;
    }
  }

  items.sort(
    (a, b) =>
      comparePeriods(a.period, b.period) ||
      a.userId.localeCompare(b.userId) ||
      a.hourLogId - b.hourLogId,
  );

  const itemIds = new Set(items.map((item) => item.hourLogId));
  const deactivated = new Set(deactivateRateIds);
  const kept = logs.filter(
    (log) => deactivated.has(log.siteRateId) && !itemIds.has(log.id),
  );

  const periods = items.map((item) => item.period);
  const sortedPeriods = [...periods].sort(comparePeriods);

  return {
    deactivateRateIds,
    createRate,
    updateRate,
    targetRateId,
    items,
    totals: {
      logs: items.length,
      users: new Set(items.map((item) => item.userId)).size,
      from: sortedPeriods[0] ?? null,
      to: sortedPeriods[sortedPeriods.length - 1] ?? null,
      fromAmount: sum(items.map((item) => item.fromAmount)),
      toAmount: sum(items.map((item) => item.toAmount)),
      touchesPastPeriods: periods.some((p) => comparePeriods(p, now) < 0),
    },
    keptOnPreviousRate: kept.length,
    fingerprint: fingerprint(
      rates,
      logs.filter(
        (log) => itemIds.has(log.id) || deactivated.has(log.siteRateId),
      ),
    ),
  };
}

const sum = (values: number[]) => values.reduce((acc, v) => acc + v, 0);

/**
 * Detects that the site's rates or the affected logs changed between the
 * preview and the apply. Not a security boundary.
 */
function fingerprint(rates: PlanRate[], logs: PlanLog[]) {
  const parts = [
    ...rates.map((rate) => `r${rate.id}:${time(rate.updatedAt)}`),
    ...logs.map((log) => `l${log.id}:${time(log.updatedAt)}`),
  ].sort();
  return hash(parts.join('|'));
}

// cyrb53: small non-cryptographic 53-bit string hash
function hash(text: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

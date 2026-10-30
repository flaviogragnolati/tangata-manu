import type { RateType } from '../../schemas/userHourLog.schema.ts';
import {
  resolveApplicableRate,
  type RateLike,
} from '../../client/lib/siteRates.ts';
import { computeAmount, totalHours } from './rateChanges.ts';

type Hours = {
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
};

export type PreviousLog = {
  id: number;
  siteId: number;
  siteRateId: number;
  normalHours: number | null;
  saturdayPreHours: number | null;
  saturdayPostHours: number | null;
  amount: number;
  metadata: unknown;
};

export type SitePlan = {
  siteId: number;
  siteName: string;
  newHours: { normal: number; saturdayPre: number; saturdayPost: number };
  previousHours: number;
  totalHours: number;
  rate: {
    id: number;
    normalRate: number | null;
    saturdayPreRate: number | null;
    saturdayPostRate: number | null;
  } | null;
  amount: number | null;
  rateChanged: boolean;
  missingRate: boolean;
};

export type HourLogCreate = Hours & { siteRateId: number; amount: number };

export type HourLogUpdate = {
  id: number;
  data: Hours & { siteRateId: number; amount: number };
  metadata: Record<string, unknown>;
  /** Set when the merge moved the whole log to another rate. */
  rateChange: {
    fromSiteRateId: number;
    toSiteRateId: number;
    fromAmount: number;
    toAmount: number;
  } | null;
};

const HOURS_FIELD: Record<RateType, keyof Hours> = {
  normal: 'normalHours',
  saturdayPre: 'saturdayPreHours',
  saturdayPost: 'saturdayPostHours',
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/**
 * Plans a user's hour load for one period. One log per site and period: new
 * hours merge into the existing log, and the whole log moves to the Tarifa
 * aplicable so its amount stays hours × one rate.
 */
export function planUserHourLog({
  entries,
  activeRates,
  previousLogs,
  sites,
  userId,
}: {
  entries: { site: number; rate: RateType; hours: number }[];
  activeRates: RateLike[];
  previousLogs: PreviousLog[];
  sites: { id: number; name: string }[];
  userId: string;
}): {
  toCreate: HourLogCreate[];
  toUpdate: HourLogUpdate[];
  perSite: SitePlan[];
} {
  const newHoursBySite = new Map<number, Hours>();
  for (const entry of entries) {
    const hours = newHoursBySite.get(entry.site) ?? {
      normalHours: 0,
      saturdayPreHours: 0,
      saturdayPostHours: 0,
    };
    hours[HOURS_FIELD[entry.rate]] += entry.hours;
    newHoursBySite.set(entry.site, hours);
  }

  const toCreate: HourLogCreate[] = [];
  const toUpdate: HourLogUpdate[] = [];
  const perSite: SitePlan[] = [];

  for (const [siteId, newHours] of newHoursBySite) {
    const rate = resolveApplicableRate(activeRates, siteId, userId);
    const siteLogs = previousLogs.filter((log) => log.siteId === siteId);
    const previous =
      siteLogs.find((log) => log.siteRateId === rate?.id) ?? siteLogs[0];

    const merged: Hours = {
      normalHours: (previous?.normalHours ?? 0) + newHours.normalHours,
      saturdayPreHours:
        (previous?.saturdayPreHours ?? 0) + newHours.saturdayPreHours,
      saturdayPostHours:
        (previous?.saturdayPostHours ?? 0) + newHours.saturdayPostHours,
    };
    const amount = rate ? computeAmount(merged, rate) : null;
    const rateChanged = !!previous && !!rate && previous.siteRateId !== rate.id;

    perSite.push({
      siteId,
      siteName:
        sites.find((site) => site.id === siteId)?.name ?? `Sitio ${siteId}`,
      newHours: {
        normal: newHours.normalHours,
        saturdayPre: newHours.saturdayPreHours,
        saturdayPost: newHours.saturdayPostHours,
      },
      previousHours: previous ? totalHours(previous) : 0,
      totalHours: totalHours(merged),
      rate: rate
        ? {
            id: rate.id,
            normalRate: rate.normalRate,
            saturdayPreRate: rate.saturdayPreRate,
            saturdayPostRate: rate.saturdayPostRate,
          }
        : null,
      amount,
      rateChanged,
      missingRate: !rate,
    });

    if (!rate || amount === null) continue;

    if (previous) {
      toUpdate.push({
        id: previous.id,
        data: { ...merged, siteRateId: rate.id, amount },
        metadata: asRecord(previous.metadata),
        rateChange: rateChanged
          ? {
              fromSiteRateId: previous.siteRateId,
              toSiteRateId: rate.id,
              fromAmount: previous.amount,
              toAmount: amount,
            }
          : null,
      });
    } else {
      toCreate.push({ ...newHours, siteRateId: rate.id, amount });
    }
  }

  return { toCreate, toUpdate, perSite };
}

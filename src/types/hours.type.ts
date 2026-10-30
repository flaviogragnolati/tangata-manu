import { type RouterOutputs } from '~/trpc/shared';

export type HourLogFull = RouterOutputs['hours']['getUserHourLogs'];

export type HourLogWithUserFull =
  RouterOutputs['hours']['getAllHourLogs'][number];

export type ExtraHours = {
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
};

export type RateChangeKind =
  'correction' | 'retroactive' | 'removal' | 'hourLoad';

/** Last rate change that rewrote a log's rate or amount; older ones are not kept. */
export type LastRateChange = {
  kind: RateChangeKind;
  fromSiteRateId: number;
  toSiteRateId: number;
  fromAmount: number;
  toAmount: number;
  byUserId: string;
  byUserName: string | null;
  at: string;
};

export type HourLogMetadata = { lastRateChange?: LastRateChange };

import { type RouterOutputs } from '~/trpc/shared';

export type HourLogFull = RouterOutputs['hours']['getUserHourLogs'];

export type HourLogWithUserFull =
  RouterOutputs['hours']['getAllHourLogs'][number];

export type ExtraHours = {
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
};

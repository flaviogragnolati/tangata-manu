import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isToday from 'dayjs/plugin/isToday';
import isBetween from 'dayjs/plugin/isBetween';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import arraySupport from 'dayjs/plugin/arraySupport';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

import 'dayjs/locale/es';

import { DEFAULT_TIME_ZONE } from '~/client/lib/period';

dayjs.locale('es');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(isBetween);
dayjs.extend(isToday);
dayjs.extend(arraySupport);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export { dayjs, Dayjs };

/** Calendar date in the users' time zone; the server renders in UTC. */
export const formatDate = (date: Date | string) =>
  dayjs(date).tz(DEFAULT_TIME_ZONE).format('DD/MM/YYYY');

export const getMonthName = (month: number) => {
  return dayjs().month(month).format('MMMM');
};

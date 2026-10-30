import type { Period } from './period.ts';
import type { UserSalary } from '~/types';
import type { NormalizedHourLog } from '~/server/lib/controller/hour.controller';

export function summarizeSalaries(
  userSalaries: Pick<UserSalary, 'userId' | 'totalHours' | 'totalAmount'>[],
) {
  const userIds = new Set<string>();
  let totalHours = 0;
  let totalAmount = 0;
  for (const salary of userSalaries) {
    userIds.add(salary.userId);
    totalHours += salary.totalHours;
    totalAmount += salary.totalAmount;
  }
  return { totalHours, totalAmount, usersCount: userIds.size };
}

export function summarizeUserPeriod(hours: NormalizedHourLog, p: Period) {
  const siteLogs = Object.values(hours[p.year]?.[p.month] ?? {});
  let totalHours = 0;
  let totalAmount = 0;
  for (const log of siteLogs) {
    totalHours +=
      log.normalHours + log.saturdayPreHours + log.saturdayPostHours;
    totalAmount +=
      log.normalAmount + log.saturdayPreAmount + log.saturdayPostAmount;
  }
  return { totalHours, totalAmount, sitesCount: siteLogs.length };
}

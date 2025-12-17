import _ from 'lodash';
import dayjs from 'dayjs';
import type { Site, Prisma } from '@prisma/client';

import { ExtraHours } from '~/types';
import type { RateType, UserHourLogFormInput } from '~/schemas';

type UserHourLogWithPayload = Prisma.UserHourLogGetPayload<{
  include: {
    User: true;
    SiteRate: true;
  };
}>;

export type NormalizedHourLogContent = {
  userHourLogId: number;
  siteName: string;
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
  normalAmount: number;
  saturdayPreAmount: number;
  saturdayPostAmount: number;
};

export type NormalizedHourLog = Record<
  number | string,
  Record<number | string, Record<number | string, NormalizedHourLogContent>>
>;

export function normalizeHourLogs(
  hourlogs: UserHourLogWithPayload[],
  sites: Site[],
) {
  /**
   * {
   *  2021[year]: {
   *   1[month]: {
   *   1[siteId]: {
   *    userHourLogId: 1,
   *    siteName: 'Site 1',
   *    normalHours: 8,
   *    saturdayPreHours: 0,
   *    saturdayPostHours: 0,
   *   },
   *  },
   * },
   */

  const hours = hourlogs.map((hourlog) => {
    const site = sites.find((site) => site.id === hourlog.SiteRate.siteId);
    if (!site) {
      return;
    }
    return {
      ...hourlog,
      siteId: site.id,
    };
  });

  const normalizedHourLog: NormalizedHourLog = {};
  const groupedByYear = _.groupBy(hours, 'year');
  _.forOwn(groupedByYear, (yearLogs, year) => {
    const groupedByMonth = _.groupBy(yearLogs, 'month');
    normalizedHourLog[year] = {};
    _.forOwn(groupedByMonth, (monthLogs, month) => {
      const groupedBySite = _.keyBy(monthLogs, 'siteId');
      normalizedHourLog[year]![month] = {};
      _.forOwn(groupedBySite, (siteLog, siteId) => {
        const site = sites.find((site) => site.id === +siteId);
        if (!site || !siteLog) {
          return;
        }
        const normalHours = siteLog.normalHours ?? 0;
        const saturdayPreHours = siteLog.saturdayPreHours ?? 0;
        const saturdayPostHours = siteLog.saturdayPostHours ?? 0;

        const normalAmount = (siteLog.SiteRate.normalRate ?? 0) * normalHours;
        const saturdayPreAmount =
          (siteLog.SiteRate.saturdayPreRate ?? 0) * saturdayPreHours;
        const saturdayPostAmount =
          (siteLog.SiteRate.saturdayPostRate ?? 0) * saturdayPostHours;

        normalizedHourLog[year]![month]![siteId] = {
          userHourLogId: siteLog?.id,
          siteName: site.name,
          normalHours,
          saturdayPostHours,
          saturdayPreHours,
          normalAmount,
          saturdayPreAmount,
          saturdayPostAmount,
        };

        //   const totalNormalHours = siteLogs.reduce(
        //     (acc, curr) => acc + (curr?.normalHours ?? 0),
        //     0,
        //   );
        //   const totalSaturdayPreHours = siteLogs.reduce(
        //     (acc, curr) => acc + (curr?.saturdayPreHours ?? 0),
        //     0,
        //   );
        //   const totalSaturdayPostHours = siteLogs.reduce(
        //     (acc, curr) => acc + (curr?.saturdayPostHours ?? 0),
        //     0,
        //   );
        //   normalizedHourLog[year]![month]![siteId] = {
        //     siteName: site.name,
        //     normalHours: totalNormalHours,
        //     saturdayPreHours: totalSaturdayPreHours,
        //     saturdayPostHours: totalSaturdayPostHours,
        //   };
      });
    });
  });

  return normalizedHourLog;
}

export type NormalizedHourLogWithUser = Record<
  string,
  Record<
    number | string,
    Record<
      number | string,
      Record<
        number | string,
        {
          siteName: string;
          normalHours: number;
          saturdayPreHours: number;
          saturdayPostHours: number;
        }
      >
    >
  >
>;

export function normalizeHourLogsByUser(
  hourlogs: UserHourLogWithPayload[],
  sites: Site[],
) {
  /**
   * {
   *   'userId': {
   *      2021[year]: {
   *       1[month]: {
   *       1[siteId]: {
   *        siteName: 'Site 1',
   *        normalHours: 8,
   *        saturdayPreHours: 0,
   *        saturdayPostHours: 0,
   *       },
   *      },
   *   },
   * },
   */

  const hours = hourlogs.map((hourlog) => {
    const site = sites.find((site) => site.id === hourlog.SiteRate.siteId);
    if (!site) return;
    return {
      ...hourlog,
      siteId: site.id,
    };
  });
  const normalizedHourLog: NormalizedHourLogWithUser = {};
  const groupedByUser = _.groupBy(hours, 'userId');
  _.forOwn(groupedByUser, (userLogs, userId) => {
    const groupedByYear = _.groupBy(userLogs, 'year');
    normalizedHourLog[userId] = {};
    _.forOwn(groupedByYear, (yearLogs, year) => {
      const groupedByMonth = _.groupBy(yearLogs, 'month');
      normalizedHourLog[userId]![year] = {};
      _.forOwn(groupedByMonth, (monthLogs, month) => {
        const groupedBySite = _.groupBy(monthLogs, 'siteId');
        normalizedHourLog[userId]![year]![month] = {};
        _.forOwn(groupedBySite, (siteLogs, siteId) => {
          const site = sites.find((site) => site.id === +siteId);
          if (!site) {
            return;
          }
          const totalNormalHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.normalHours ?? 0),
            0,
          );
          const totalSaturdayPreHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.saturdayPreHours ?? 0),
            0,
          );
          const totalSaturdayPostHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.saturdayPostHours ?? 0),
            0,
          );
          normalizedHourLog[userId]![year]![month]![siteId] = {
            siteName: site.name,
            normalHours: totalNormalHours,
            saturdayPreHours: totalSaturdayPreHours,
            saturdayPostHours: totalSaturdayPostHours,
          };
        });
      });
    });
  });

  return normalizedHourLog;
}

export type UserSalary = {
  userId: string;
  userName: string | null;
  siteId: string;
  siteName: string;
  year: number;
  month: number;
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
  totalHours: number;
  normalAmount: number;
  saturdayPreAmount: number;
  saturdayPostAmount: number;
  totalAmount: number;
};

export function normalizeUserSalaries(
  hourlogs: UserHourLogWithPayload[],
  sites: Site[],
) {
  let hours = hourlogs.map((hourlog) => {
    const site = sites.find((site) => site.id === hourlog.SiteRate.siteId);
    if (!site) return;
    return {
      ...hourlog,
      siteId: site.id,
      date: dayjs().year(hourlog.year).month(hourlog.month),
    };
  });
  hours = _.sortBy(hours, 'date');

  const groupedByUser = _.groupBy(hours, 'userId');
  const userSalaries: UserSalary[] = [];

  _.forOwn(groupedByUser, (userLogs, userId) => {
    const user = userLogs?.[0]?.User;
    if (!user) return;
    const groupedByYear = _.groupBy(userLogs, 'year');
    _.forOwn(groupedByYear, (yearLogs, year) => {
      const groupedByMonth = _.groupBy(yearLogs, 'month');
      _.forOwn(groupedByMonth, (monthLogs, month) => {
        const groupedBySite = _.groupBy(monthLogs, 'siteId');

        let extraSalaryHours = 0;
        _.forOwn(groupedBySite, (siteLogs, siteId) => {
          const site = sites.find((site) => site.id === +siteId);
          if (!site) {
            return;
          }
          const normalHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.normalHours ?? 0),
            0,
          );
          const saturdayPreHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.saturdayPreHours ?? 0),
            0,
          );
          const saturdayPostHours = siteLogs.reduce(
            (acc, curr) => acc + (curr?.saturdayPostHours ?? 0),
            0,
          );
          const totalHours = normalHours + saturdayPreHours + saturdayPostHours;

          const normalRate = siteLogs[0]?.SiteRate.normalRate ?? 0;
          const saturdayPreRate = siteLogs[0]?.SiteRate.saturdayPreRate ?? 0;
          const saturdayPostRate = siteLogs[0]?.SiteRate.saturdayPostRate ?? 0;

          const normalAmount = normalRate * normalHours;
          const saturdayPreAmount = saturdayPreRate * saturdayPreHours;
          const saturdayPostAmount = saturdayPostRate * saturdayPostHours;
          const totalAmount =
            normalAmount + saturdayPreAmount + saturdayPostAmount;

          extraSalaryHours += totalHours;
          userSalaries.push({
            userId,
            userName: user.name,
            siteId,
            siteName: site.name,
            year: +year,
            month: +month,
            totalHours,
            normalHours,
            saturdayPreHours,
            saturdayPostHours,
            totalAmount,
            normalAmount,
            saturdayPreAmount,
            saturdayPostAmount,
          });
        });
      });
    });
  });

  const extraSalaries: {
    userId: string;
    siteId: string;
    year: number;
    first: ExtraHours;
    second: ExtraHours;
  }[] = [];
  const users = _.keys(groupedByUser);
  users.forEach((userId) => {
    const userExtraSalaries = getExtraSalaryForUser(userSalaries, userId);
    extraSalaries.push(...userExtraSalaries);
  });

  return { userSalaries, extraSalaries };
}

export const isFirstHalf = (month: number) => month <= 5;
export const isSecondHalf = (month: number) => month > 5;

function getExtraSalaryForUser(salaries: UserSalary[], userId: string) {
  const userHalfHours = salaries.filter((salary) => salary.userId === userId);

  const userExtraHoursBySite: Record<
    number,
    Record<string, Record<'first' | 'second', ExtraHours>>
  > = {}; // {[year: number]: {[siteId: string]: {first: ExtraHours, second: ExtraHours}}};

  userHalfHours.forEach((salary) => {
    const half = isFirstHalf(salary.month) ? 'first' : 'second';
    if (!userExtraHoursBySite[salary.year]) {
      userExtraHoursBySite[salary.year] = {};
    }
    if (!userExtraHoursBySite[salary.year]![salary.siteId]) {
      userExtraHoursBySite[salary.year]![salary.siteId] = {
        first: { normalHours: 0, saturdayPreHours: 0, saturdayPostHours: 0 },
        second: { normalHours: 0, saturdayPreHours: 0, saturdayPostHours: 0 },
      };
    }
    const extraHours = userExtraHoursBySite[salary.year]![salary.siteId]![half];
    if (extraHours) {
      extraHours.normalHours +=
        Math.round((salary.normalHours / 12) * 100) / 100;
      extraHours.saturdayPreHours +=
        Math.round((salary.saturdayPreHours / 12) * 100) / 100;
      extraHours.saturdayPostHours +=
        Math.round((salary.saturdayPostHours / 12) * 100) / 100;
    }
  });

  const result: {
    userId: string;
    siteId: string;
    year: number;
    first: ExtraHours;
    second: ExtraHours;
  }[] = [];

  Object.entries(userExtraHoursBySite).forEach(([year, siteData]) => {
    Object.entries(siteData).forEach(([siteId, extraHours]) => {
      result.push({
        userId,
        siteId,
        year: Number(year),
        first: extraHours.first,
        second: extraHours.second,
      });
    });
  });

  return result;
}

function sumHoursByRate(hours: UserHourLogFormInput['hours'], rate: RateType) {
  return hours.reduce((acc, curr) => {
    if (curr.rate === rate) {
      return acc + curr.hours;
    }
    return acc;
  }, 0);
}

export function parseConfirmationHours(
  hours: Record<number, UserHourLogFormInput['hours']>,
  sites: Site[],
) {
  return Object.entries(hours).map(([siteId, hours]) => {
    const site = sites.find((site) => site.id === Number(siteId))!;
    return {
      siteId: site.id,
      siteName: site.name,
      normal: sumHoursByRate(hours, 'normal'),
      saturdayPre: sumHoursByRate(hours, 'saturdayPre'),
      saturdayPost: sumHoursByRate(hours, 'saturdayPost'),
    };
  });
}

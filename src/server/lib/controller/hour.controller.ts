import _ from 'lodash';
import type { Site, Prisma } from '@prisma/client';
import dayjs from 'dayjs';

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
        normalizedHourLog[year]![month]![siteId] = {
          userHourLogId: siteLog?.id,
          siteName: site.name,
          normalHours: siteLog.normalHours ?? 0,
          saturdayPreHours: siteLog.saturdayPreHours ?? 0,
          saturdayPostHours: siteLog.saturdayPostHours ?? 0,
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
    if (!site) {
      return;
    }
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
  totalHours: number;
  totalAmount: number;
};

export function normalizeUserSalaries(
  hourlogs: UserHourLogWithPayload[],
  sites: Site[],
) {
  let hours = hourlogs.map((hourlog) => {
    const site = sites.find((site) => site.id === hourlog.SiteRate.siteId);
    if (!site) {
      return;
    }
    return {
      ...hourlog,
      siteId: site.id,
      date: dayjs().year(hourlog.year).month(hourlog.month),
    };
  });
  hours = _.sortBy(hours, 'date');

  const groupedByUser = _.groupBy(hours, 'userId');
  const userSalaries: UserSalary[] = [];
  const userExtraSalaries: [string, number, number, number][] = []; // [userId, year, month, extraSalary][]
  _.forOwn(groupedByUser, (userLogs, userId) => {
    const user = userLogs?.[0]?.User;
    if (!user) {
      return;
    }
    const groupedByYear = _.groupBy(userLogs, 'year');
    _.forOwn(groupedByYear, (yearLogs, year) => {
      const groupedByMonth = _.groupBy(yearLogs, 'month');
      _.forOwn(groupedByMonth, (monthLogs, month) => {
        const groupedBySite = _.groupBy(monthLogs, 'siteId');

        let extraSalary = 0;
        _.forOwn(groupedBySite, (siteLogs, siteId) => {
          const site = sites.find((site) => site.id === +siteId);
          if (!site) {
            return;
          }
          const totalHours = siteLogs.reduce(
            (acc, curr) =>
              acc +
              (curr?.normalHours ?? 0) +
              (curr?.saturdayPreHours ?? 0) +
              (curr?.saturdayPostHours ?? 0),
            0,
          );
          const totalAmount = siteLogs.reduce(
            (acc, curr) => acc + (curr?.amount ?? 0),
            0,
          );
          extraSalary += totalAmount;
          userSalaries.push({
            userId,
            userName: user.name,
            siteId,
            siteName: site.name,
            year: +year,
            month: +month,
            totalHours,
            totalAmount,
          });
        });
        userExtraSalaries.push([
          userId,
          +year,
          +month,
          Math.ceil(extraSalary / 12),
        ]);
      });
    });
  });

  return { userSalaries, userExtraSalaries };
}

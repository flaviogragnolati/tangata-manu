import _ from 'lodash';
import type { Site, Prisma } from '@prisma/client';

type UserHourLogWithPayload = Prisma.UserHourLogGetPayload<{
  include: {
    User: true;
    SiteRate: true;
  };
}>;

export type NormalizedHourLog = Record<
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
      const groupedBySite = _.groupBy(monthLogs, 'siteId');
      normalizedHourLog[year]![month] = {};
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
        normalizedHourLog[year]![month]![siteId] = {
          siteName: site.name,
          normalHours: totalNormalHours,
          saturdayPreHours: totalSaturdayPreHours,
          saturdayPostHours: totalSaturdayPostHours,
        };
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

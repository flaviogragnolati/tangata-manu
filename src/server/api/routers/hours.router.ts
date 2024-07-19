import _ from 'lodash';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

import { userHourLogFormSchema } from '~/schemas';
import {
  normalizeHourLogs,
  normalizeHourLogsByUser,
} from '~/controller/hour.controller';
import {
  adminProcedure,
  createTRPCRouter,
  userProcedure,
} from '~/server/api/trpc';

export const hoursRouter = createTRPCRouter({
  getAllHourLogs: adminProcedure.query(async ({ ctx }) => {
    const hourlogs = await ctx.db.userHourLog.findMany({
      include: {
        User: true,
        SiteRate: {
          include: {
            Site: true,
          },
        },
      },
      orderBy: {
        year: 'desc',
      },
    });

    return hourlogs;

    // const sites = await ctx.db.site.findMany();
    // const sitesById = _.keyBy(sites, 'id');

    // const hours = normalizeHourLogsByUser(hourlogs, sites);

    // type Data = {
    //   userId: string;
    //   userName: string | null;
    //   siteId: string;
    //   siteName: string;
    //   siteRateId: string;
    //   year: number;
    //   month: number;
    //   normalHours: number;
    //   saturdayPreHours: number;
    //   saturdayPostHours: number;
    //   totalHours: number;
    //   normalAmount: number;
    //   saturdayPreAmount: number;
    //   saturdayPostAmount: number;
    //   amount: number;
    //   date: Date;
    // };
    // const data: Data[] = [];

    // const userIds = _.keys(hours);

    // const users = await ctx.db.user.findMany({
    //   where: { id: { in: userIds } },
    // });

    // const usersById = _.keyBy(users, 'id');

    // for (const userId of userIds) {
    //   const user = usersById[userId];
    //   const userHours = hours[userId];
    //   if (!userHours || !user) continue;
    //   const years = _.keys(userHours);
    //   for (const year of years) {
    //     const yearHours = userHours[year];
    //     if (!yearHours) continue;
    //     const months = _.keys(yearHours);
    //     for (const month of months) {
    //       const monthHours = yearHours[month];
    //       if (!monthHours) continue;
    //       const siteIds = _.keys(monthHours);
    //       for (const siteId of siteIds) {
    //         const site = sitesById[siteId];
    //         const siteHours = monthHours[siteId];
    //         if (!siteHours || site) continue;
    //         data.push({
    //           userId,
    //           userName: user.name,
    //           siteId,
    //           siteName: site.name,
    //           year: Number(year),
    //           month: Number(month),
    //           normalHours: siteHours.reduce(
    //             (acc, curr) => acc + curr.normalHours,
    //             0,
    //           ),
    //           saturdayPreHours: siteHours.reduce(
    //             (acc, curr) => acc + curr.saturdayPreHours,
    //             0,
    //           ),
    //           saturdayPostHours: siteHours.reduce(
    //             (acc, curr) => acc + curr.saturdayPostHours,
    //             0,
    //           ),
    //           totalHours: siteHours.reduce(
    //             (acc, curr) =>
    //               acc +
    //               curr.normalHours +
    //               curr.saturdayPreHours +
    //               curr.saturdayPostHours,
    //             0,
    //           ),
    //           normalAmount: siteHours.reduce(
    //             (acc, curr) => acc + curr.normalAmount,
    //             0,
    //           ),
    //           saturdayPreAmount: siteHours.reduce(
    //             (acc, curr) => acc + curr.saturdayPreAmount,
    //             0,
    //           ),
    //           saturdayPostAmount: siteHours.reduce(
    //             (acc, curr) => acc + curr.saturdayPostAmount,
    //             0,
    //           ),
    //           amount: siteHours.reduce((acc, curr) => acc + curr.amount, 0),
    //           date: new Date(Number(year), Number(month)),
    //         });
    //       }
    //     }
    //   }
    // }

    // return hourlogs;
  }),
  getUserHourLogs: userProcedure
    .input(
      z
        .object({ userId: z.string().optional(), date: z.date().optional() })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const userId = input?.userId ?? ctx.user.id;
      const date = input?.date;

      let hourlogs: Prisma.UserHourLogGetPayload<{
        include: {
          User: true;
          SiteRate: true;
        };
      }>[];
      if (date) {
        hourlogs = await ctx.db.userHourLog.findMany({
          where: {
            userId,
            year: date.getFullYear(),
            month: date.getMonth(),
          },
          include: {
            User: true,
            SiteRate: true,
          },
        });
      } else {
        hourlogs = await ctx.db.userHourLog.findMany({
          where: { userId },
          include: {
            User: true,
            SiteRate: true,
          },
          orderBy: {
            year: 'desc',
          },
        });
      }

      const sites = await ctx.db.site.findMany();

      return normalizeHourLogs(hourlogs, sites);
    }),
  addUserHourLog: userProcedure
    .input(userHourLogFormSchema)
    .mutation(async ({ input, ctx }) => {
      // 1. get siteIds from input
      const siteIds = _.uniq(input.hours.map((entry) => entry.site));

      const siteRates = await ctx.db.siteRate.findMany({
        where: {
          siteId: { in: siteIds },
          active: true,
        },
      });
      const siteRatesById = {} as Record<number, (typeof siteRates)[number]>;
      siteRates.forEach((siteRate) => {
        if (!siteRatesById[siteRate.siteId]) {
          siteRatesById[siteRate.siteId] = siteRate;
        }
      });

      // 2. check all siteIds have an active siteRate
      const missingSiteRates = siteIds.filter(
        (siteId) => !siteRatesById[siteId],
      );
      if (missingSiteRates.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Missing active siteRate for siteIds: ${missingSiteRates.join(
            ', ',
          )}`,
        });
      }

      // 3. sum hours by site and by rate
      const hoursBySite = _.groupBy(input.hours, 'site');
      const hoursBySiteAndRate = _.mapValues(hoursBySite, (hours) =>
        _.groupBy(hours, 'rate'),
      );

      console.log('hoursBySiteAndRate', JSON.stringify(hoursBySiteAndRate));

      const userHourLogs: Prisma.UserHourLogUncheckedCreateInput[] = [];

      _.forOwn(hoursBySiteAndRate, (hoursByRate, siteId) => {
        const siteRate = siteRatesById?.[Number(siteId)];
        if (!siteRate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Missing active siteRate for siteId: ${siteId}`,
          });
        }

        const normalHours =
          hoursByRate.normal?.reduce((acc, curr) => acc + curr.hours, 0) ?? 0;
        const saturdayPreHours =
          hoursByRate.saturdayPre?.reduce((acc, curr) => acc + curr.hours, 0) ??
          0;
        const saturdayPostHours =
          hoursByRate.saturdayPost?.reduce(
            (acc, curr) => acc + curr.hours,
            0,
          ) ?? 0;

        const amount =
          normalHours * (siteRate.normalRate ?? 0) +
          saturdayPreHours * (siteRate.saturdayPreRate ?? 0) +
          saturdayPostHours * (siteRate.saturdayPostRate ?? 0);

        const data = {
          userId: ctx.user.id,
          siteRateId: siteRate.id,
          month: input.month,
          year: input.year,
          normalHours,
          saturdayPreHours,
          saturdayPostHours,
          amount,
          metadata: {
            totalHours: normalHours + saturdayPreHours + saturdayPostHours,
            normalAmount: normalHours * (siteRate.normalRate ?? 0),
            saturdayPreAmount:
              saturdayPreHours * (siteRate.saturdayPreRate ?? 0),
            saturdayPostAmount:
              saturdayPostHours * (siteRate.saturdayPostRate ?? 0),
          },
        };

        userHourLogs.push(data);
      });

      await ctx.db.userHourLog.createMany({
        data: userHourLogs,
      });

      return true;
    }),
});

import _ from 'lodash';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

import { userHourLogFormSchema } from '~/schemas';
import {
  normalizeHourLogs,
  normalizeUserSalaries,
} from '~/controller/hour.controller';
import {
  adminProcedure,
  createTRPCRouter,
  userProcedure,
} from '~/server/api/trpc';

export const hoursRouter = createTRPCRouter({
  getUsersSalaries: adminProcedure
    .input(
      z
        .object({
          year: z.number().optional(),
          month: z.number().optional(),
          userIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const year = input?.year;
      const month = input?.month;
      const userIds = input?.userIds;

      let hourLogs: Prisma.UserHourLogGetPayload<{
        include: {
          User: true;
          SiteRate: true;
        };
      }>[];
      if (userIds?.length) {
        hourLogs = await ctx.db.userHourLog.findMany({
          where: {
            userId: { in: userIds },
            year,
            month,
          },
          include: {
            User: true,
            SiteRate: true,
          },
        });
      } else {
        hourLogs = await ctx.db.userHourLog.findMany({
          where: {
            year,
            month,
          },
          include: {
            User: true,
            SiteRate: true,
          },
        });
      }

      const sites = await ctx.db.site.findMany();

      return normalizeUserSalaries(hourLogs, sites);
    }),
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

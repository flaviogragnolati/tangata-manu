import _ from 'lodash';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { dayjs } from '~/utils/dayjs';
import {
  adminProcedure,
  createTRPCRouter,
  userProcedure,
} from '~/server/api/trpc';
import { userHourLogFormSchema } from '~/schemas';

export const hoursRouter = createTRPCRouter({
  getAllHourLogs: adminProcedure.query(async ({ ctx }) => {
    const hourlogs = await ctx.db.userHourLog.findMany({
      include: {
        User: true,
        SiteRate: true,
      },
      orderBy: {
        year: 'desc',
        month: 'desc',
      },
    });
  }),
  getUserHourLogs: userProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId;
      const hourlogs = await ctx.db.userHourLog.findMany({
        where: { userId },
        include: {
          User: true,
          SiteRate: true,
        },
        orderBy: {
          year: 'desc',
          month: 'desc',
        },
      });

      const normalizedHourLogs: Record<string, (typeof hourlogs)[number]> = {};

      return normalizedHourLogs;
    }),

  getUserHourLogForDate: userProcedure
    .input(z.object({ userId: z.string(), date: z.date() }))
    .query(async ({ input, ctx }) => {
      const date = dayjs(input.date).toDate();
      const userId = input.userId;

      return await ctx.db.userHourLog.findFirst({
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
    }),
  upsertUserHourLog: userProcedure
    .input(userHourLogFormSchema)
    .mutation(async ({ input, ctx }) => {
      // 2. check siteId exists and fetch 'active' siteRate
      const siteIds = input.hours.map((entry) => entry.siteId);
      const siteRatesById = _.groupBy(
        await ctx.db.siteRate.findMany({
          where: {
            siteId: { in: siteIds },
            active: true,
          },
        }),
        'siteId',
      );

      // 3. check all siteIds have an active siteRate
      const missingSiteRates = siteIds.filter(
        (siteId) => !siteRatesById[siteId]?.length,
      );
      if (missingSiteRates.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Missing active siteRate for siteIds: ${missingSiteRates.join(
            ', ',
          )}`,
        });
      }

      // 4. parse siteRateId
      const hourLog = [];
      for (const entry of input.hours) {
        const siteRate = siteRatesById[entry.siteId]![0]!;
        const siteRateId = siteRate.id;

        if (
          !entry.normalHours &&
          !entry.saturdayPostHours &&
          !entry.saturdayPreHours
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'At least one hour type is required',
          });
        }

        hourLog.push({
          userId: ctx.user.id,
          siteRateId,
          year: input.year,
          month: input.month,
          normalHours: entry.normalHours,
          saturdayPreHours: entry.saturdayPreHours,
          saturdayPostHours: entry.saturdayPostHours,
        });
      }

      // 4. check if there is an existing hourLog for the year-month-siteRateId
      const hourLog = await ctx.db.userHourLog.findFirst({
        where: {
          userId: ctx.user.id,
          year: input.year,
          month: input.month,
        },
      });
    }),
});

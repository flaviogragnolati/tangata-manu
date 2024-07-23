import _ from 'lodash';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

import { dayjs } from '~/utils/dayjs';
import { updateHourLogSchema, userHourLogFormSchema } from '~/schemas';
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
  getUserContextHourLogs: userProcedure
    .input(z.object({ userId: z.string(), date: z.date().optional() }))
    .query(async ({ input, ctx }) => {
      const month = dayjs(input.date).month();
      const year = dayjs(input.date).year();
      const prevMonth = dayjs(input.date).subtract(1, 'month').toDate();
      const nextMonth = dayjs(input.date).add(1, 'month').toDate();

      const [sites, hourLogs] = await Promise.all([
        ctx.db.site.findMany(),

        ctx.db.userHourLog.findMany({
          where: {
            year: {
              in:
                month === 0
                  ? [year - 1, year] // if month is january, we need to get the previous year
                  : month === 11
                    ? [year, year + 1] // if month is december, we need to get the next year
                    : [year], // else we get the current year
            },
            month: {
              in:
                month === 0
                  ? [11, 0] // if month is january, we need to get the previous month
                  : month === 11
                    ? [10, 11] // if month is december, we need to get the next month
                    : [prevMonth.getMonth(), month, nextMonth.getMonth()], // else we get the current month
            },
          },
          include: {
            User: true,
            SiteRate: true,
          },
        }),
      ]);

      return normalizeHourLogs(hourLogs, sites);
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

      // const mockHourLogs =
      //   [] ||
      //   [...hourlogs, ...hourlogs, ...hourlogs].map((hourlog, idx) => {
      //     return {
      //       ...hourlog,
      //       year: 2023,
      //       month: idx % 2 === 0 ? 1 + idx : idx,
      //     };
      //   });

      return normalizeHourLogs(hourlogs, sites);
    }),
  addUserHourLog: userProcedure
    .input(userHourLogFormSchema)
    .mutation(async ({ input, ctx }) => {
      // 1. get siteIds from input
      const siteIds = _.uniq(input.hours.map((entry) => entry.site));
      // 2. find previous userHourLog for same userId, year and month

      const [siteRates, previousUserHourLogs] = await Promise.all([
        await ctx.db.siteRate.findMany({
          where: {
            siteId: { in: siteIds },
            active: true,
          },
        }),
        await ctx.db.userHourLog.findMany({
          where: {
            userId: ctx.user.id,
            year: input.year,
            month: input.month,
          },
          include: {
            SiteRate: {
              include: {
                Site: true,
              },
            },
          },
        }),
      ]);

      // 3. sum hours by site and by rate
      const hoursBySite = _.groupBy(input.hours, 'site');
      const hoursBySiteAndRate = _.mapValues(hoursBySite, (hours) =>
        _.groupBy(hours, 'rate'),
      );

      const userHourLogs: {
        siteRateId: number;
        siteId: number;
        normalHours: number;
        saturdayPreHours: number;
        saturdayPostHours: number;
        amount: number;
      }[] = [];

      // 4. parse hoursBySiteAndRate and calculate amount
      _.forOwn(hoursBySiteAndRate, (hoursByRate, siteId) => {
        // find user specific siteRate if exists else get the first siteRate
        const siteRate =
          siteRates.find(
            (siteRate) =>
              siteRate.siteId === parseInt(siteId) &&
              siteRate.userId === ctx.user.id,
          ) ??
          siteRates.find((siteRate) => siteRate.siteId === parseInt(siteId));

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
          siteRateId: siteRate.id,
          siteId: siteRate.siteId,
          normalHours,
          saturdayPreHours,
          saturdayPostHours,
          amount,
        };

        userHourLogs.push(data);
      });

      const userHourLogsToUpdate: (Prisma.UserHourLogUncheckedUpdateInput & {
        id: number;
      })[] = [];
      const userHourLogsToCreate: Prisma.UserHourLogUncheckedCreateInput[] = [];

      userHourLogs.forEach((userHourLog) => {
        // find previous userHourLog for same userId, year, month and siteRateId
        const previousUserHourLog =
          previousUserHourLogs.find(
            (prevUserLog) => prevUserLog.siteRateId === userHourLog.siteRateId,
          ) ??
          previousUserHourLogs.find(
            (prevUserLog) =>
              prevUserLog.SiteRate.Site.id === userHourLog.siteId,
          );

        // if previousUserHourLog is found, we either update the same siteRateId or not
        if (previousUserHourLog) {
          const updatedUserHourLog = {
            ..._.omit(previousUserHourLog, 'SiteRate'),
            siteRateId: userHourLog.siteRateId, // if same siteRateId was found then its the same id, else it's the `new` siteRateId,
            normalHours:
              (previousUserHourLog.normalHours ?? 0) + userHourLog.normalHours,
            saturdayPreHours:
              (previousUserHourLog.saturdayPreHours ?? 0) +
              userHourLog.saturdayPreHours,
            saturdayPostHours:
              (previousUserHourLog.saturdayPostHours ?? 0) +
              userHourLog.saturdayPostHours,
            amount: previousUserHourLog.amount + userHourLog.amount,
            metadata: {},
          };
          userHourLogsToUpdate.push(updatedUserHourLog);
        }
        // else we create a new entry
        else {
          const newUserHourLog = {
            ..._.omit(userHourLog, 'siteId'),
            userId: ctx.user.id,
            year: input.year,
            month: input.month,
            metadata: {},
          };
          userHourLogsToCreate.push(newUserHourLog);
        }
      });

      userHourLogsToUpdate.length &&
        (await Promise.all(
          userHourLogsToUpdate.map((userHourLog) => {
            return ctx.db.userHourLog.update({
              where: { id: userHourLog.id },
              data: { ...userHourLog, id: undefined },
            });
          }),
        ));
      userHourLogsToCreate.length &&
        (await Promise.all([
          ctx.db.userHourLog.createMany({
            data: userHourLogsToCreate,
          }),
        ]));

      return true;
    }),
  updateUserHourLog: userProcedure
    .input(updateHourLogSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        normalHours = 0,
        saturdayPreHours = 0,
        saturdayPostHours = 0,
      } = input;
      const userHourLog = await ctx.db.userHourLog.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          SiteRate: true,
        },
      });

      const amount =
        normalHours * (userHourLog.SiteRate.normalRate ?? 0) +
        saturdayPreHours * (userHourLog.SiteRate.saturdayPreRate ?? 0) +
        saturdayPostHours * (userHourLog.SiteRate.saturdayPostRate ?? 0);

      return await ctx.db.userHourLog.update({
        where: { id },
        data: {
          normalHours,
          saturdayPreHours,
          saturdayPostHours,
          amount,
        },
      });
    }),
});

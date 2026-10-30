import _ from 'lodash';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

import { dayjs } from '~/utils/dayjs';
import {
  updateHourLogSchema,
  userHourLogFormSchema,
  type UserHourLogForm,
} from '~/schemas';
import type { LastRateChange } from '~/types';
import {
  normalizeHourLogs,
  normalizeUserSalaries,
} from '~/controller/hour.controller';
import { computeAmount } from '~/server/lib/rateChanges';
import { planUserHourLog } from '~/server/lib/userHourLogPlan';
import {
  activeUserProcedure,
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
    .input(
      z
        .object({ userId: z.string().optional(), date: z.date().optional() })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const userId = input?.userId ?? ctx.user.id;
      const month = dayjs(input?.date).month();
      const year = dayjs(input?.date).year();
      const prevMonth = dayjs(input?.date).subtract(1, 'month').toDate();
      const nextMonth = dayjs(input?.date).add(1, 'month').toDate();

      const [sites, hourLogs] = await Promise.all([
        ctx.db.site.findMany(),

        ctx.db.userHourLog.findMany({
          where: {
            userId,
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

      return normalizeHourLogs(hourlogs, sites);
    }),
  previewUserHourLog: activeUserProcedure
    .input(userHourLogFormSchema)
    .query(async ({ input, ctx }) => {
      const { perSite } = await planHourLoad(ctx.db, input, ctx.user.id);
      return perSite;
    }),
  addUserHourLog: activeUserProcedure
    .input(userHourLogFormSchema)
    .mutation(async ({ input, ctx }) => {
      const { toCreate, toUpdate, perSite } = await planHourLoad(
        ctx.db,
        input,
        ctx.user.id,
      );

      const missing = perSite.find((site) => site.missingRate);
      if (missing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `El sitio ${missing.siteName} no tiene tarifa vigente. Avise al administrador.`,
        });
      }

      const at = new Date().toISOString();
      await ctx.db.$transaction([
        ...toUpdate.map(({ id, data, metadata, rateChange }) => {
          const lastRateChange: LastRateChange | null = rateChange && {
            kind: 'hourLoad',
            ...rateChange,
            byUserId: ctx.user.id,
            byUserName: ctx.user.name ?? null,
            at,
          };
          return ctx.db.userHourLog.update({
            where: { id },
            data: {
              ...data,
              metadata: (lastRateChange
                ? { ...metadata, lastRateChange }
                : metadata) as Prisma.InputJsonValue,
            },
          });
        }),
        ctx.db.userHourLog.createMany({
          data: toCreate.map((log) => ({
            ...log,
            userId: ctx.user.id,
            year: input.year,
            month: input.month,
            metadata: {},
          })),
        }),
      ]);

      return true;
    }),
  updateUserHourLog: activeUserProcedure
    .input(updateHourLogSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        normalHours = 0,
        saturdayPreHours = 0,
        saturdayPostHours = 0,
      } = input;
      const userHourLog = await ctx.db.userHourLog.findFirst({
        where: { id, userId: ctx.user.id },
        include: { SiteRate: true },
      });
      if (!userHourLog) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No se encontró el registro de horas',
        });
      }

      const hours = { normalHours, saturdayPreHours, saturdayPostHours };
      const amount = computeAmount(hours, userHourLog.SiteRate);

      return await ctx.db.userHourLog.update({
        where: { id },
        data: { ...hours, amount },
      });
    }),
});

async function planHourLoad(
  db: Prisma.TransactionClient,
  input: UserHourLogForm,
  userId: string,
) {
  const siteIds = _.uniq(input.hours.map((entry) => entry.site));
  const [activeRates, previousLogs, sites] = await Promise.all([
    db.siteRate.findMany({ where: { siteId: { in: siteIds }, active: true } }),
    db.userHourLog.findMany({
      where: { userId, year: input.year, month: input.month },
      include: { SiteRate: { select: { siteId: true } } },
    }),
    db.site.findMany({
      where: { id: { in: siteIds } },
      select: { id: true, name: true },
    }),
  ]);

  return planUserHourLog({
    entries: input.hours,
    activeRates,
    previousLogs: previousLogs.map((log) => ({
      ...log,
      siteId: log.SiteRate.siteId,
    })),
    sites,
    userId,
  });
}

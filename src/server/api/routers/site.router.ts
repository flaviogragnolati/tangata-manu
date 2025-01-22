import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { siteSchema, siteRateSchema } from '~/schemas';
import type { SiteRate, UserHourLog } from '@prisma/client';
import {
  adminProcedure,
  createTRPCRouter,
  userProcedure,
} from '~/server/api/trpc';

export const siteRouter = createTRPCRouter({
  upsertSite: adminProcedure
    .input(siteSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...siteData } = input;
      const data = {
        ...siteData,
        createdById: ctx.user.id,
      };
      if (id) {
        try {
          return await ctx.db.site.update({
            where: { id },
            data,
          });
        } catch (err) {
          const error = err as Error;
          console.error(`Error updating site: ${error.message}`);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error updating site',
          });
        }
      } else {
        try {
          return await ctx.db.site.create({ data });
        } catch (err) {
          const error = err as Error;
          console.error(`Error creating site: ${error.message}`);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Error creating site',
          });
        }
      }
    }),
  editSiteRate: adminProcedure
    .input(siteRateSchema.extend({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { siteId, ...inputData } = input;
      const data = {
        ...inputData,
        createdById: ctx.user.id,
      };

      // 1. update the site rate
      try {
        const siteRate = await ctx.db.siteRate.update({
          where: { id: data.id },
          data,
        });
        const normalRate = siteRate.normalRate ?? 0;
        const saturdayPreRate = siteRate.saturdayPreRate ?? 0;
        const saturdayPostRate = siteRate.saturdayPostRate ?? 0;

        // 2. trigger a recalculation of the user's salary
        // 2.1 Get all the UserHourLogs for the rate being updated
        const userHourLogs = await ctx.db.userHourLog.findMany({
          where: { siteRateId: data.id },
        });

        // 2.2 For each UserHourLog, recalculate the salary
        await Promise.all(
          userHourLogs.map(async (userHourLog) => {
            const normalHours = userHourLog.normalHours ?? 0;
            const saturdayPreHours = userHourLog.saturdayPreHours ?? 0;
            const saturdayPostHours = userHourLog.saturdayPostHours ?? 0;
            const amount =
              normalHours * normalRate +
              saturdayPreHours * saturdayPreRate +
              saturdayPostHours * saturdayPostRate;

            await ctx.db.userHourLog.update({
              where: { id: userHourLog.id },
              data: { amount, edited: true },
            });
          }),
        );

        return siteRate;
      } catch (err) {
        const error = err as Error;
        console.error(`Error updating site rate: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error updating site rate',
        });
      }
    }),
  createSiteRate: adminProcedure
    .input(siteRateSchema)
    .mutation(async ({ input, ctx }) => {
      const { retroactiveFrom, ...inputData } = input;

      // 1. Check if there is another `active` SiteRate for the same site & userId combination
      const activeSiteRate = input.userId
        ? await ctx.db.siteRate.findFirst({
            where: {
              siteId: input.siteId,
              userId: input.userId,
              active: true,
            },
          })
        : await ctx.db.siteRate.findFirst({
            where: {
              siteId: input.siteId,
              active: true,
            },
          });

      const data = {
        ...inputData,
        createdById: ctx.user.id,
      };

      let siteRate: SiteRate | null;
      try {
        if (activeSiteRate) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_updatedSiteRate, newSiteRate] = await ctx.db.$transaction([
            ctx.db.siteRate.updateMany({
              where: {
                siteId: input.siteId,
                userId: input.userId ? input.userId : null,
              }, // only update 'generic' siteRates
              data: { active: false },
            }),
            ctx.db.siteRate.create({ data }),
          ]);
          siteRate = newSiteRate;
        } else {
          siteRate = await ctx.db.siteRate.create({ data });
        }
      } catch (err) {
        const error = err as Error;
        console.error(`Error creating site rate: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating site rate',
        });
      }

      if (retroactiveFrom) {
        // we need to retroactively update the UserHourLogs
        // we need to find all the UserHourLogs that are affected by the new rate
        let userHourLogs: UserHourLog[] = [];
        if (siteRate.userId) {
          // if the siteRate targets a specific user
          userHourLogs = await ctx.db.userHourLog.findMany({
            where: {
              SiteRate: { siteId: siteRate.siteId },
              userId: siteRate.userId,
              createdAt: { gte: retroactiveFrom },
            },
          });
        } else {
          userHourLogs = await ctx.db.userHourLog.findMany({
            where: {
              SiteRate: { siteId: siteRate.siteId },
              createdAt: { gte: retroactiveFrom },
            },
          });
        }
        // for each UserHourLog, recalculate the amount with the new rate
        const updatedUserHourLogs = await Promise.all(
          userHourLogs.map(async (userHourLog) => {
            const normalHours = userHourLog.normalHours ?? 0;
            const saturdayPreHours = userHourLog.saturdayPreHours ?? 0;
            const saturdayPostHours = userHourLog.saturdayPostHours ?? 0;
            const amount =
              normalHours * (siteRate.normalRate ?? 0) +
              saturdayPreHours * (siteRate.saturdayPreRate ?? 0) +
              saturdayPostHours * (siteRate.saturdayPostRate ?? 0);

            return await ctx.db.userHourLog.update({
              where: { id: userHourLog.id },
              data: {
                siteRateId: siteRate.id,
                amount,
                retroactiveUpdate: true,
              },
            });
          }),
        );

        return {
          siteRate,
          updatedUserHourLogs,
        };
      }
    }),
  deleteSiteRate: adminProcedure
    .input(z.number())
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.db.siteRate.delete({ where: { id: input } });
      } catch (err) {
        const error = err as Error;
        console.error(`Error deleting site rate: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error deleting site rate',
        });
      }
    }),
  getAllSites: userProcedure
    .input(z.object({ includeCreatedBy: z.boolean() }).optional())
    .query(async ({ input, ctx }) => {
      if (input?.includeCreatedBy) {
        return await ctx.db.site.findMany({
          include: { CreatedBy: true },
        });
      }
      return await ctx.db.site.findMany();
    }),
  getAllSiteRates: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.siteRate.findMany({
      include: {
        Site: true,
        CreatedBy: true,
        User: true,
      },
    });
  }),
  getActiveSiteRates: userProcedure
    .input(
      z
        .object({ includeSite: z.boolean().optional().default(true) })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const includeSite =
        typeof input?.includeSite === 'undefined' ? false : input?.includeSite;

      if (includeSite) {
        return await ctx.db.siteRate.findMany({
          where: { active: true },
          include: {
            Site: true,
          },
        });
      }
      return await ctx.db.siteRate.findMany({
        where: { active: true },
      });
    }),
});

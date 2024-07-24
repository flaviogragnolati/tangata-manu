import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import { siteSchema, siteRateSchema } from '~/schemas';
import {
  adminProcedure,
  createTRPCRouter,
  superAdminProcedure,
  userProcedure,
} from '~/server/api/trpc';

export const siteRouter = createTRPCRouter({
  createSite: superAdminProcedure
    .input(siteSchema)
    .mutation(async ({ input, ctx }) => {
      const data = {
        ...input,
        createdById: ctx.user.id,
      };

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
    }),
  createSiteRate: adminProcedure
    .input(siteRateSchema)
    .mutation(async ({ input, ctx }) => {
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

      console.log('activeSiteRate', activeSiteRate);

      const data = {
        ...input,
        saturdayPreRate: input.saturdayPreRate ?? input.normalRate * 1.25,
        saturdayPostRate: input.saturdayPostRate ?? input.normalRate * 1.5,
        createdById: ctx.user.id,
      };

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
          return newSiteRate;
        } else {
          return await ctx.db.siteRate.create({ data });
        }
      } catch (err) {
        const error = err as Error;
        console.error(`Error creating site rate: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Error creating site rate',
        });
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
  getAllSites: userProcedure.query(async ({ ctx }) => {
    return await ctx.db.site.findMany({
      include: {
        CreatedBy: true,
      },
    });
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
  getActiveSiteRates: userProcedure.query(async ({ ctx }) => {
    return await ctx.db.siteRate.findMany({
      where: { active: true },
      include: {
        Site: true,
      },
    });
  }),
});

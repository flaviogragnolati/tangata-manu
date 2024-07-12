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
      // 1. Check if there is another `active` SiteRate for the same site
      const activeSiteRate = await ctx.db.siteRate.findFirst({
        where: {
          siteId: input.siteId,
          active: true,
        },
      });

      const data = {
        ...input,
        saturdayPreRate: input.saturdayPreRate ?? input.normalRate * 1.25,
        saturdayPostRate: input.saturdayPostRate ?? input.normalRate * 1.5,
        createdById: ctx.user.id,
      };

      try {
        if (activeSiteRate) {
          const [updatedSiteRate, newSiteRate] = await ctx.db.$transaction([
            ctx.db.siteRate.updateMany({
              where: { siteId: input.siteId },
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

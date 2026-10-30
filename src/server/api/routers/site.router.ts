import { z } from 'zod';
import { TRPCError } from '@trpc/server';

import {
  applyRateChangeSchema,
  deleteRateSchema,
  rateChangeSchema,
  siteSchema,
  type RateChangeInput,
} from '~/schemas';
import { Prisma } from '@prisma/client';
import type { LastRateChange, RateChangeKind } from '~/types';
import { currentPeriod } from '~/client/lib/period';
import {
  planRateChange,
  RateChangeError,
  type RateChangeErrorCode,
  type RateChangePlan,
} from '~/server/lib/rateChanges';
import {
  planRateDeletion,
  RateDeletionError,
  type RateDeletionErrorCode,
} from '~/server/lib/rateDeletion';
import {
  adminProcedure,
  createTRPCRouter,
  userProcedure,
} from '~/server/api/trpc';

export const siteRouter = createTRPCRouter({
  upsertSite: adminProcedure
    .input(siteSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
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
          return await ctx.db.site.create({
            data: { ...data, createdById: ctx.user.id },
          });
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
  previewRateChange: adminProcedure
    .input(rateChangeSchema)
    .query(async ({ input, ctx }) => {
      const siteId = await resolveSiteId(ctx.db, input);
      const data = await loadSiteData(ctx.db, siteId);
      const plan = runPlan(input, data);
      return toPreview(plan, data);
    }),
  applyRateChange: adminProcedure
    .input(applyRateChangeSchema)
    .mutation(async ({ input, ctx }) => {
      const { change, expectedFingerprint } = input;
      try {
        return await ctx.db.$transaction(
          async (tx) => {
            // Re-plan on fresh data: the preview's plan is only for display
            const siteId = await resolveSiteId(tx, change);
            const data = await loadSiteData(tx, siteId);
            const plan = runPlan(change, data);
            if (plan.fingerprint !== expectedFingerprint) {
              throw new TRPCError({
                code: 'CONFLICT',
                message:
                  'Las horas o tarifas cambiaron mientras revisaba el impacto. Revise el impacto de nuevo.',
              });
            }

            if (plan.deactivateRateIds.length) {
              await tx.siteRate.updateMany({
                where: { id: { in: plan.deactivateRateIds } },
                data: { active: false },
              });
            }
            let targetRateId = plan.targetRateId;
            if (plan.createRate) {
              const created = await tx.siteRate.create({
                data: {
                  siteId: plan.createRate.siteId,
                  userId: plan.createRate.userId,
                  replacedRateId: plan.createRate.replacedRateId,
                  ...plan.createRate.values,
                  createdById: ctx.user.id,
                },
              });
              targetRateId = created.id;
            }
            if (plan.updateRate) {
              await tx.siteRate.update({
                where: { id: plan.updateRate.id },
                data: plan.updateRate.values,
              });
            }
            if (targetRateId === 'new') {
              throw new Error('Rate change plan has no target rate');
            }

            const kind = LOG_CHANGE_KIND[change.kind];
            const flag =
              change.kind === 'correct'
                ? { edited: true }
                : { retroactiveUpdate: true };
            const metadataById = new Map(
              data.logs.map((log) => [log.id, log.metadata]),
            );
            const at = new Date().toISOString();
            for (const item of plan.items) {
              const lastRateChange: LastRateChange = {
                kind,
                fromSiteRateId: item.fromSiteRateId,
                toSiteRateId: targetRateId,
                fromAmount: item.fromAmount,
                toAmount: item.toAmount,
                byUserId: ctx.user.id,
                byUserName: ctx.user.name ?? null,
                at,
              };
              await tx.userHourLog.update({
                where: { id: item.hourLogId },
                data: {
                  siteRateId: targetRateId,
                  amount: item.toAmount,
                  ...flag,
                  metadata: {
                    ...asRecord(metadataById.get(item.hourLogId)),
                    lastRateChange,
                  } as Prisma.InputJsonValue,
                },
              });
            }

            return {
              siteRateId: targetRateId,
              recalculated: plan.items.length,
              fromAmount: plan.totals.fromAmount,
              toAmount: plan.totals.toAmount,
            };
          },
          { timeout: 20_000 },
        );
      } catch (err) {
        if (err instanceof TRPCError) {
          console.error(`Error applying rate change: ${err.code}`);
          throw err;
        }
        const error = err as Error;
        console.error(`Error applying rate change: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo aplicar el cambio de tarifa',
        });
      }
    }),
  previewRateDeletion: adminProcedure
    .input(z.object({ siteRateId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const { rate, rates, plan } = await loadDeletionPlan(
        ctx.db,
        input.siteRateId,
      );
      const restore = rates.find((r) => r.id === plan.restoreRateId);
      const siteRate =
        plan.outcome === 'leavesScopeEmpty' && rate.userId
          ? rates
              .filter((r) => r.active && !r.userId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
          : undefined;

      return {
        rate: {
          id: rate.id,
          siteName: rate.Site.name,
          userId: rate.userId,
          userName: rate.User ? (rate.User.name ?? rate.User.email) : null,
          active: rate.active,
          createdAt: rate.createdAt,
          normalRate: rate.normalRate,
          saturdayPreRate: rate.saturdayPreRate,
          saturdayPostRate: rate.saturdayPostRate,
        },
        outcome: plan.outcome,
        restoreRate: restore
          ? {
              id: restore.id,
              normalRate: restore.normalRate,
              saturdayPreRate: restore.saturdayPreRate,
              saturdayPostRate: restore.saturdayPostRate,
              createdAt: restore.createdAt,
            }
          : null,
        fallbackSiteRate: siteRate ? { normalRate: siteRate.normalRate } : null,
      };
    }),
  deleteSiteRate: adminProcedure
    .input(deleteRateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.db.$transaction(async (tx) => {
          const { rate, plan } = await loadDeletionPlan(
            tx,
            input.siteRateId,
            'CONFLICT',
          );
          if (plan.restoreRateId !== input.expectedRestoreRateId) {
            throw new TRPCError({
              code: 'CONFLICT',
              message:
                'Las tarifas cambiaron mientras revisaba. Revise de nuevo.',
            });
          }

          // Before the delete: SetNull would otherwise cut the replacement chain
          await tx.siteRate.updateMany({
            where: { replacedRateId: rate.id },
            data: { replacedRateId: rate.replacedRateId },
          });
          if (plan.restoreRateId) {
            await tx.siteRate.update({
              where: { id: plan.restoreRateId },
              data: { active: true },
            });
          }
          await tx.siteRate.delete({ where: { id: rate.id } });

          return { deletedId: rate.id, restoredRateId: plan.restoreRateId };
        });
      } catch (err) {
        if (err instanceof TRPCError) {
          console.error(`Error deleting site rate: ${err.code}`);
          throw err;
        }
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2003'
        ) {
          console.error(`Error deleting site rate: ${err.code}`);
          throw new TRPCError({
            code: 'CONFLICT',
            message: LOGS_ADDED_MESSAGE,
          });
        }
        const error = err as Error;
        console.error(`Error deleting site rate: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No se pudo borrar la tarifa',
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
        _count: { select: { UserHourLog: true } },
      },
      orderBy: { createdAt: 'desc' },
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

type Db = Prisma.TransactionClient;
type SiteData = Awaited<ReturnType<typeof loadSiteData>>;

const RATE_DELETION_ERRORS: Record<
  RateDeletionErrorCode,
  { code: 'NOT_FOUND' | 'BAD_REQUEST'; message: string }
> = {
  RATE_NOT_FOUND: { code: 'NOT_FOUND', message: 'No se encontró la tarifa.' },
  HAS_LOGS: {
    code: 'BAD_REQUEST',
    message: 'La tarifa tiene registros de horas y no se puede borrar.',
  },
};

const RATE_CHANGE_MESSAGES: Record<RateChangeErrorCode, string> = {
  RATE_NOT_FOUND: 'No se encontró la tarifa.',
  NOT_ACTIVE: 'La tarifa ya no está vigente.',
  NOT_USER_RATE: 'La tarifa del sitio no se puede quitar; cargue una nueva.',
  NO_SITE_RATE:
    'El sitio no tiene tarifa del sitio vigente. Cárguela antes de quitar la tarifa por usuario.',
  NO_CHANGES: 'Los valores son iguales a los actuales.',
  FUTURE_PERIOD: 'El período elegido es posterior al actual.',
};

// A replace without retroactive rewrites no logs, so it has no log kind
const LOG_CHANGE_KIND: Record<RateChangeInput['kind'], RateChangeKind> = {
  replace: 'retroactive',
  correct: 'correction',
  removeUserRate: 'removal',
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

async function resolveSiteId(db: Db, change: RateChangeInput) {
  if (change.kind === 'replace') {
    const site = await db.site.findUnique({ where: { id: change.siteId } });
    if (!site) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No se encontró el sitio.',
      });
    }
    return site.id;
  }
  const rate = await db.siteRate.findUnique({
    where: { id: change.siteRateId },
  });
  if (!rate) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: RATE_CHANGE_MESSAGES.RATE_NOT_FOUND,
    });
  }
  return rate.siteId;
}

async function loadSiteData(db: Db, siteId: number) {
  const [site, rates, logs] = await Promise.all([
    db.site.findUniqueOrThrow({ where: { id: siteId } }),
    db.siteRate.findMany({ where: { siteId } }),
    db.userHourLog.findMany({
      where: { SiteRate: { siteId } },
      include: { User: { select: { name: true, email: true } } },
    }),
  ]);
  return { site, rates, logs };
}

function runPlan(change: RateChangeInput, { rates, logs }: SiteData) {
  try {
    return planRateChange({ change, rates, logs, now: currentPeriod() });
  } catch (err) {
    if (err instanceof RateChangeError) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: RATE_CHANGE_MESSAGES[err.code],
      });
    }
    throw err;
  }
}

const LOGS_ADDED_MESSAGE =
  'La tarifa ya tiene registros de horas y no se puede borrar.';

/** `hasLogsCode`: logs that appeared after the preview are a conflict, not a bad request. */
async function loadDeletionPlan(
  db: Db,
  siteRateId: number,
  hasLogsCode: 'BAD_REQUEST' | 'CONFLICT' = 'BAD_REQUEST',
) {
  const rate = await db.siteRate.findUnique({
    where: { id: siteRateId },
    include: { Site: true, User: true },
  });
  if (!rate) {
    throw new TRPCError(RATE_DELETION_ERRORS.RATE_NOT_FOUND);
  }
  const [rates, logsCount] = await Promise.all([
    db.siteRate.findMany({ where: { siteId: rate.siteId } }),
    db.userHourLog.count({ where: { siteRateId } }),
  ]);
  try {
    const plan = planRateDeletion({ siteRateId, rates, logsCount });
    return { rate, rates, plan };
  } catch (err) {
    if (err instanceof RateDeletionError) {
      throw new TRPCError(
        err.code === 'HAS_LOGS' && hasLogsCode === 'CONFLICT'
          ? { code: 'CONFLICT', message: LOGS_ADDED_MESSAGE }
          : RATE_DELETION_ERRORS[err.code],
      );
    }
    throw err;
  }
}

function toPreview(
  {
    deactivateRateIds: _deactivated,
    createRate,
    updateRate,
    ...plan
  }: RateChangePlan,
  { site, rates, logs }: SiteData,
) {
  const replaced = rates.find((rate) => rate.id === createRate?.replacedRateId);
  const target =
    createRate?.values ??
    updateRate?.values ??
    rates.find((rate) => rate.id === plan.targetRateId);
  const userById = new Map(logs.map((log) => [log.userId, log.User]));

  return {
    ...plan,
    siteName: site.name,
    replacedRate: replaced
      ? {
          id: replaced.id,
          normalRate: replaced.normalRate,
          saturdayPreRate: replaced.saturdayPreRate,
          saturdayPostRate: replaced.saturdayPostRate,
          createdAt: replaced.createdAt,
        }
      : null,
    targetValues: {
      normalRate: target?.normalRate ?? 0,
      saturdayPreRate: target?.saturdayPreRate ?? 0,
      saturdayPostRate: target?.saturdayPostRate ?? 0,
    },
    items: plan.items.map((item) => ({
      ...item,
      userName: userById.get(item.userId)?.name ?? null,
      userEmail: userById.get(item.userId)?.email ?? null,
    })),
  };
}

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';

import { deactivateUserSchema, userIdSchema } from '~/schemas';
import { currentPeriod } from '~/client/lib/period';
import { latestPeriodByUser } from '~/client/lib/users';
import { totalHours } from '~/server/lib/rateChanges';
import { adminProcedure, createTRPCRouter } from '~/server/api/trpc';

export const userRouter = createTRPCRouter({
  getUsers: adminProcedure
    .input(
      z
        .object({
          userIds: z.array(z.string()).optional(),
          emails: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      if (input?.userIds) {
        return await ctx.db.user.findMany({
          where: { id: { in: input.userIds } },
        });
      } else if (input?.emails) {
        return await ctx.db.user.findMany({
          where: { email: { in: input.emails } },
        });
      } else {
        return await ctx.db.user.findMany();
      }
    }),
  getUsersOverview: adminProcedure.query(async ({ ctx }) => {
    const [users, rateCounts, logs] = await Promise.all([
      ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          deactivatedAt: true,
        },
      }),
      ctx.db.siteRate.groupBy({
        by: ['userId'],
        where: { active: true, userId: { not: null } },
        _count: true,
      }),
      ctx.db.userHourLog.findMany({
        select: { userId: true, year: true, month: true },
      }),
    ]);
    const ratesByUser = new Map(
      rateCounts.map((row) => [row.userId, row._count]),
    );
    const lastPeriods = latestPeriodByUser(logs);

    return users
      .map((user) => ({
        ...user,
        activeUserRates: ratesByUser.get(user.id) ?? 0,
        lastPeriod: lastPeriods.get(user.id) ?? null,
      }))
      .sort((a, b) =>
        (a.name ?? a.email ?? '').localeCompare(b.name ?? b.email ?? '', 'es'),
      );
  }),
  previewUserDeactivation: adminProcedure
    .input(userIdSchema)
    .query(async ({ input, ctx }) => {
      const user = await loadUserForStatusChange(
        ctx.db,
        input.userId,
        ctx.user.id,
        'deactivate',
      );
      const period = currentPeriod();
      const [rates, logs] = await Promise.all([
        ctx.db.siteRate.findMany({
          where: { userId: user.id, active: true },
          include: { Site: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.userHourLog.findMany({
          where: { userId: user.id, ...period },
        }),
      ]);

      return {
        user,
        activeUserRates: rates.map((rate) => ({
          id: rate.id,
          siteName: rate.Site.name,
          normalRate: rate.normalRate,
        })),
        currentPeriod: {
          period,
          hours: logs.reduce((acc, log) => acc + totalHours(log), 0),
          amount: logs.reduce((acc, log) => acc + log.amount, 0),
        },
      };
    }),
  deactivateUser: adminProcedure
    .input(deactivateUserSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await ctx.db.$transaction(async (tx) => {
          const user = await loadUserForStatusChange(
            tx,
            input.userId,
            ctx.user.id,
            'deactivate',
          );
          const rates = await tx.siteRate.findMany({
            where: { userId: user.id, active: true },
            select: { id: true },
          });
          const sortedIds = (ids: number[]) =>
            [...ids].sort((a, b) => a - b).join(',');
          if (
            sortedIds(rates.map((rate) => rate.id)) !==
            sortedIds(input.expectedRateIds)
          ) {
            throw new TRPCError({
              code: 'CONFLICT',
              message:
                'Las tarifas del usuario cambiaron mientras revisaba. Revise de nuevo.',
            });
          }

          await tx.user.update({
            where: { id: user.id },
            data: { deactivatedAt: new Date() },
          });
          // Logs keep their applied rate: deactivating is never retroactive
          const { count } = await tx.siteRate.updateMany({
            where: { userId: user.id, active: true },
            data: { active: false },
          });
          return { deactivatedRates: count };
        });
      } catch (err) {
        throw toStatusError(err, 'Error deactivating user', 'dar de baja');
      }
    }),
  reactivateUser: adminProcedure
    .input(userIdSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await loadUserForStatusChange(
          ctx.db,
          input.userId,
          ctx.user.id,
          'reactivate',
        );
        await ctx.db.user.update({
          where: { id: user.id },
          data: { deactivatedAt: null },
        });
        return { ok: true as const };
      } catch (err) {
        throw toStatusError(err, 'Error reactivating user', 'reactivar');
      }
    }),
});

type Db = Prisma.TransactionClient;

async function loadUserForStatusChange(
  db: Db,
  userId: string,
  currentUserId: string,
  action: 'deactivate' | 'reactivate',
) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      deactivatedAt: true,
    },
  });
  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'No se encontró el usuario.',
    });
  }
  if (user.role !== 'USER') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Solo se puede dar de baja a profesionales.',
    });
  }
  if (user.id === currentUserId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No puede cambiar el estado de su propio usuario.',
    });
  }
  if (action === 'deactivate' && user.deactivatedAt) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'El usuario ya está dado de baja.',
    });
  }
  if (action === 'reactivate' && !user.deactivatedAt) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'El usuario no está dado de baja.',
    });
  }
  return user;
}

function toStatusError(err: unknown, log: string, verb: string) {
  if (err instanceof TRPCError) {
    console.error(`${log}: ${err.code}`);
    return err;
  }
  const error = err as Error;
  console.error(`${log}: ${error.message}`);
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `No se pudo ${verb} al usuario`,
  });
}

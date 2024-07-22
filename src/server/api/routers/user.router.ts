import { z } from 'zod';

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
});

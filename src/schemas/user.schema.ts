import { z } from 'zod';

export const userIdSchema = z.object({ userId: z.string().min(1) });

export const deactivateUserSchema = userIdSchema.extend({
  expectedRateIds: z.array(z.number().int()),
});

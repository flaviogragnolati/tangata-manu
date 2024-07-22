import { z } from 'zod';

export const siteRateSchema = z.object({
  siteId: z.number().int().positive(),
  normalRate: z.number().positive(),
  saturdayPreRate: z.number().positive().nullable(),
  saturdayPostRate: z.number().positive().nullable(),
  userId: z.string().nullable(),
  active: z.boolean().default(true),
});

export type SiteRate = z.infer<typeof siteRateSchema>;

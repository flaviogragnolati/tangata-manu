import { z } from 'zod';

export const siteRateSchema = z.object({
  siteId: z.number().int().positive(),
  normalRate: z.number().min(0),
  saturdayPreRate: z.number().min(0).nullable(),
  saturdayPostRate: z.number().min(0).nullable(),
  userId: z.string().nullish(),
  active: z.boolean().default(true),
});

export type SiteRate = z.infer<typeof siteRateSchema>;

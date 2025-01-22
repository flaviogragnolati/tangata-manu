import { z } from 'zod';

export const siteRateSchema = z.object({
  siteId: z.number().int().positive(),
  normalRate: z.number().min(0).nullish().default(0),
  saturdayPreRate: z.number().min(0).nullish().default(0),
  saturdayPostRate: z.number().min(0).nullish().default(0),
  userId: z.string().nullish(),
  active: z.boolean().default(true),
  retroactiveFrom: z.string().nullish().default(null),
});

export type SiteRate = z.infer<typeof siteRateSchema>;

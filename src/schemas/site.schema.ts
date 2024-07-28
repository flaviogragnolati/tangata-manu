import { z } from 'zod';

export const siteSchema = z.object({
  id: z.number().nullish(),
  name: z.string(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  allowsExtraHours: z.boolean().nullish().default(false),
});

export type Site = z.infer<typeof siteSchema>;

import { z } from 'zod';

export const siteSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  location: z.string().nullable(),
});

export type Site = z.infer<typeof siteSchema>;

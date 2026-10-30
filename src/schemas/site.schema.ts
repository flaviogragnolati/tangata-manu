import { z } from 'zod';

export const siteSchema = z.object({
  id: z.number().nullish(),
  name: z
    .string()
    .trim()
    .min(1, 'Ingrese el nombre del sitio')
    .max(80, 'Use 80 caracteres o menos'),
  description: z.string().nullish(),
  location: z.string().nullish(),
  allowsExtraHours: z.boolean().nullish().default(false),
});

export type Site = z.infer<typeof siteSchema>;

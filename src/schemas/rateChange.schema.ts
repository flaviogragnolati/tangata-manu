import { z } from 'zod';

export const periodSchema = z.object({
  year: z.number().int().min(2023).max(2030),
  month: z.number().int().min(0).max(11),
});

export const rateValuesSchema = z.object({
  normalRate: z.number().min(0),
  saturdayPreRate: z.number().min(0).default(0),
  saturdayPostRate: z.number().min(0).default(0),
});
export type RateValues = z.infer<typeof rateValuesSchema>;

export const rateChangeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('replace'),
    siteId: z.number().int().positive(),
    userId: z.string().nullable(),
    values: rateValuesSchema,
    retroactiveFrom: periodSchema.nullable(),
  }),
  z.object({
    kind: z.literal('correct'),
    siteRateId: z.number().int().positive(),
    values: rateValuesSchema,
  }),
  z.object({
    kind: z.literal('removeUserRate'),
    siteRateId: z.number().int().positive(),
    retroactiveFrom: periodSchema.nullable(),
  }),
]);
export type RateChangeInput = z.infer<typeof rateChangeSchema>;

export const applyRateChangeSchema = z.object({
  change: rateChangeSchema,
  expectedFingerprint: z.string(),
});

export const deleteRateSchema = z.object({
  siteRateId: z.number().int().positive(),
  expectedRestoreRateId: z.number().int().positive().nullable(),
});

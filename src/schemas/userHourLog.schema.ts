import { z } from 'zod';
import { C } from '~/constants';

export const rateTypeEnum = z.enum(C.rateTypes);
export type RateType = z.infer<typeof rateTypeEnum>;

export const userHourLogSchema = z
  .array(
    z.object({
      site: z.number().int().positive(),
      rate: rateTypeEnum,
      hours: z.number().positive(),
    }),
  )
  .min(1);
export type UserHourLog = z.infer<typeof userHourLogSchema>;

export const userHourLogFormInputSchema = z.object({
  hours: userHourLogSchema,
});
export type UserHourLogFormInput = z.infer<typeof userHourLogFormInputSchema>;

// export const userHourLogSchema = z
//   .array(
//     z.object({
//       siteId: z.number().int().positive(),
//       normalHours: z.number().positive().nullish(),
//       saturdayPreHours: z.number().positive().nullish(),
//       saturdayPostHours: z.number().positive().nullish(),
//     }),
//   )
//   .min(1);
// export type UserHourLog = z.infer<typeof userHourLogSchema>;

// export const userHourLogFormSchema = z.object({
//   year: z.number().int().min(2023).max(2025),
//   month: z.number().int().min(0).max(11),
//   hours: userHourLogSchema,
// });
// export type UserHourLogForm = z.infer<typeof userHourLogFormSchema>;

export const userHourLogFormSchema = z.object({
  year: z.number().int().min(2023).max(2025),
  month: z.number().int().min(0).max(11),
  hours: userHourLogSchema,
});
export type UserHourLogForm = z.infer<typeof userHourLogFormSchema>;

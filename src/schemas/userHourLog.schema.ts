import { z } from 'zod';
import { C } from '~/constants';

export const rateTypeEnum = z.enum(C.rateTypes, {
  errorMap: () => ({ message: 'Elija el tipo de hora' }),
});
export type RateType = z.infer<typeof rateTypeEnum>;

export const userHourLogSchema = z
  .array(
    z.object({
      site: z
        .number({
          required_error: 'Elija un sitio',
          invalid_type_error: 'Elija un sitio',
        })
        .int()
        .positive('Elija un sitio'),
      rate: rateTypeEnum,
      hours: z
        .number({
          required_error: 'Ingrese la cantidad de horas',
          invalid_type_error: 'Ingrese la cantidad de horas',
        })
        .positive('Ingrese una cantidad mayor a 0'),
    }),
  )
  .min(1);
export type UserHourLog = z.infer<typeof userHourLogSchema>;

export const userHourLogFormInputSchema = z.object({
  hours: userHourLogSchema,
});
export type UserHourLogFormInput = z.infer<typeof userHourLogFormInputSchema>;

export const userHourLogFormSchema = z.object({
  year: z.number().int().min(2023).max(2030),
  month: z.number().int().min(0).max(11),
  hours: userHourLogSchema,
});
export type UserHourLogForm = z.infer<typeof userHourLogFormSchema>;

const hoursField = z
  .number({ invalid_type_error: 'Ingrese la cantidad de horas' })
  .min(0, 'Ingrese 0 o más horas')
  .optional()
  .default(0);

export const updateHourLogSchema = z.object({
  id: z.number().int().positive(),
  normalHours: hoursField,
  saturdayPreHours: hoursField,
  saturdayPostHours: hoursField,
});

export type UpdateHourLog = z.infer<typeof updateHourLogSchema>;

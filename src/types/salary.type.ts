import { type RouterOutputs } from '~/trpc/shared';

export type UserSalariesWithExtraSalary =
  RouterOutputs['hours']['getUsersSalaries'];

export type UserSalary = UserSalariesWithExtraSalary['userSalaries'][0];

export type UserSalaryWithExtra = UserSalary & {
  extraSalary?: number;
};

export type GroupedSalaries = Record<
  string | number,
  UserSalaryWithExtra[] | null
>;

export type ExtraSalary = {
  userId: string;
  siteId: string;
  year: number;
  month: number;
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
};

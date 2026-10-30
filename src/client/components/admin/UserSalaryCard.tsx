'use client';

import type { User } from '@prisma/client';
import { Divider, Stack, Typography } from '@mui/material';

import C from '~/constants';
import { type UserSalary } from '~/types';
import UserAvatar from '~/client/components/ui/UserAvatar';
import SalaryCard, { SalaryLine } from '~/components/admin/SalaryCard';

type Props = {
  user: User;
  salary: UserSalary[];
  extraSalary?: number;
  delta?: number | null;
};
export default function UserSalaryCard({
  user,
  salary,
  extraSalary,
  delta,
}: Props) {
  if (!salary || salary.length === 0) {
    return null;
  }
  return (
    <SalaryCard
      avatar={
        <UserAvatar name={user.name} email={user.email} image={user.image} />
      }
      title={user.name ?? user.email}
      subheader={user.name ? user.email : undefined}
      totalAmount={salary.reduce((acc, curr) => acc + curr.totalAmount, 0)}
      totalHours={salary.reduce((acc, curr) => acc + curr.totalHours, 0)}
      extraSalary={extraSalary ?? 0}
      delta={delta}
    >
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {salary.map((row) => (
          <Stack key={row.siteId} spacing={0.5}>
            <Typography variant="subtitle2">{row.siteName}</Typography>
            {C.rateTypes.map((rateType) => {
              const hours = row[`${rateType}Hours`];
              if (!hours) return null;
              return (
                <SalaryLine
                  key={rateType}
                  label={C.rateTypesMap[rateType]}
                  hours={hours}
                  amount={row[`${rateType}Amount`]}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    </SalaryCard>
  );
}

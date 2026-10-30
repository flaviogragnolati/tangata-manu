'use client';

import type { Site } from '@prisma/client';
import { Avatar, Stack } from '@mui/material';

import SalaryCard, { SalaryLine } from '~/components/admin/SalaryCard';

type Props = {
  site: Site;
  salary: {
    userId: string;
    userName: string | null;
    totalHours: number;
    totalAmount: number;
  }[];
  extraSalary?: number;
  delta?: number | null;
};
export default function SiteSalaryCard({
  site,
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
        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
          {site.name[0]?.toUpperCase()}
        </Avatar>
      }
      title={site.name}
      subheader={site.description}
      totalAmount={salary.reduce((acc, curr) => acc + curr.totalAmount, 0)}
      totalHours={salary.reduce((acc, curr) => acc + curr.totalHours, 0)}
      extraSalary={extraSalary ?? 0}
      delta={delta}
    >
      <Stack spacing={1}>
        {salary.map((row) => (
          <SalaryLine
            key={row.userId}
            label={row.userName}
            hours={row.totalHours}
            amount={row.totalAmount}
          />
        ))}
      </Stack>
    </SalaryCard>
  );
}

'use client';

import type { ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import { ARSformatter } from '~/utils/helpers';
import { DeltaChip } from '~/client/components/ui/StatCard';

type Props = {
  avatar: ReactNode;
  title: ReactNode;
  subheader?: ReactNode;
  totalAmount: number;
  totalHours: number;
  extraSalary: number;
  delta?: number | null;
  children: ReactNode;
};

export default function SalaryCard({
  avatar,
  title,
  subheader,
  totalAmount,
  totalHours,
  extraSalary,
  delta,
  children,
}: Props) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={avatar}
        title={title}
        subheader={subheader}
        slotProps={{
          title: { noWrap: true },
          subheader: { noWrap: true },
        }}
        action={
          <Stack sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {ARSformatter.format(totalAmount)}
            </Typography>
            <DeltaChip delta={delta} />
          </Stack>
        }
        sx={{
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          rowGap: 1,
          '& .MuiCardHeader-content': { minWidth: 0 },
          '& .MuiCardHeader-action': {
            m: 0,
            pl: { xs: 0, sm: 1 },
            width: { xs: '100%', sm: 'auto' },
            flexShrink: 0,
          },
        }}
      />
      <Divider />
      <CardContent sx={{ flex: 1 }}>{children}</CardContent>
      <Divider />
      <Stack
        direction="row"
        sx={{
          px: 2,
          py: 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Total {totalHours} h
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          label={`Aguinaldo ${ARSformatter.format(extraSalary)}`}
        />
      </Stack>
    </Card>
  );
}

export function SalaryLine({
  label,
  hours,
  amount,
}: {
  label: ReactNode;
  hours: number;
  amount: number;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ flex: 1, minWidth: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ flexShrink: 0, display: 'flex', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {hours} h
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, minWidth: 90, textAlign: 'right' }}
        >
          {ARSformatter.format(amount)}
        </Typography>
      </Box>
    </Stack>
  );
}

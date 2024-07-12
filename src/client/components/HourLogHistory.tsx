'use client';
import { Stack, Typography } from '@mui/material';

import { dayjs } from '~/utils/dayjs';
import type { HourLogFull } from '~/types';

type Props = {
  hours: HourLogFull;
};
export default function HourLogHistory({ hours }: Props) {
  const months = Object.keys(hours);

  return (
    <Stack spacing={2} direction="column">
      {months.map((month) => (
        <Stack direction="row" key={month}>
          <Typography variant="body1">{month}</Typography>
          <Stack direction="column" spacing={1}>
            {hours?.[month as keyof typeof hours].map((hour) => (
              <Stack key={hour.id} direction="row" spacing={1}>
                <Typography variant="body2">{hour.amount}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

function getMonthNameInLocaleFromDate(date: string | Date) {
  return dayjs(date).format('MMMM');
}

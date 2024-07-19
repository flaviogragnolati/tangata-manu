'use client';
import { capitalize } from 'lodash';
import { Divider, Stack, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import { getMonthNameInLocaleFromDate } from '~/utils/dayjs';

type Props = {
  hours: HourLogFull;
};
export default function HourLogHistory({ hours }: Props) {
  const years = Object.keys(hours);
  return (
    <Stack spacing={2} direction="column">
      {years.map((year) => (
        <Stack key={year} spacing={2} direction="column">
          {Object.keys(hours[year] ?? []).map((month) => (
            <Stack key={month} spacing={2} direction="column">
              <Divider>
                <Typography variant="h6">
                  {capitalize(
                    getMonthNameInLocaleFromDate(`${year}-${month}-01`),
                  )}
                </Typography>
              </Divider>
              {Object.keys(hours[year]![month] ?? []).map((siteId) => (
                <Stack key={siteId} spacing={2} direction="column">
                  <Typography variant="h6">
                    {hours[year]![month]![siteId]!.siteName}
                  </Typography>
                  <Typography>
                    Horas normales: {hours[year]![month]![siteId]!.normalHours}
                  </Typography>
                  <Typography>
                    Horas sábado pre:{' '}
                    {hours[year]![month]![siteId]!.saturdayPreHours}
                  </Typography>
                  <Typography>
                    Horas sábado post:{' '}
                    {hours[year]![month]![siteId]!.saturdayPostHours}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

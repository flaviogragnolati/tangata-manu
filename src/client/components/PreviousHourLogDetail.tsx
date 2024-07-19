import { Stack, Typography } from '@mui/material';
import { keys } from 'lodash';
import type { HourLogFull } from '~/types';

type Props = {
  hours: HourLogFull;
};
export default function PreviousHourLogDetail({ hours }: Props) {
  const year = keys(hours)[0];
  if (!year || !hours[year]) return null;
  const month = keys(hours[year])[0];
  if (!month || !hours[year]?.[month]) return null;
  const hoursBySite = hours[year][month];
  if (!hoursBySite) return null;
  const sites = keys(hoursBySite);

  const totalHours = sites.reduce((acc, siteId) => {
    const siteLog = hoursBySite[siteId];
    if (!siteLog) return acc;
    return (
      acc +
      siteLog.normalHours +
      siteLog.saturdayPreHours +
      siteLog.saturdayPostHours
    );
  }, 0);

  return (
    <div>
      <Typography variant="h6">Horas cargadas previamente</Typography>
      <Stack spacing={2} direction="column">
        {sites.map((siteId) => {
          const siteLog = hoursBySite[siteId];
          console.log('siteLog', siteLog);
          if (!siteLog) return null;
          return (
            <Stack key={siteId} spacing={2} direction="column">
              <h2>{siteLog.siteName}</h2>
              <p>Horas normales: {siteLog.normalHours}</p>
              <p>Horas sábado previo 14:00: {siteLog.saturdayPreHours}</p>
              <p>Horas sábado pasadas 14:00: {siteLog.saturdayPostHours}</p>
            </Stack>
          );
        })}
      </Stack>
      <h2>Total de horas: {totalHours}</h2>
    </div>
  );
}

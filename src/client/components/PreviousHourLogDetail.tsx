import { keys } from 'lodash';
import { Grid, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import SiteHourCard from '~/components/user/SiteHourCard';

type Props = {
  hours: HourLogFull;
  month: number;
  year: number;
};
export default function PreviousHourLogDetail({ hours, year, month }: Props) {
  const hoursBySite = hours[year]?.[month];

  const sites = keys(hoursBySite);

  const totalHours = sites.reduce((acc, siteId) => {
    const siteLog = hoursBySite?.[siteId];
    if (!siteLog) return acc;
    return (
      acc +
      siteLog.normalHours +
      siteLog.saturdayPreHours +
      siteLog.saturdayPostHours
    );
  }, 0);

  if (!hoursBySite)
    return (
      <Typography variant="body1">No hay horas cargadas previamente</Typography>
    );

  return (
    <Grid container xs={12}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Horas cargadas previamente
        </Typography>
      </Grid>
      {sites.map((siteId) => {
        const siteLog = hoursBySite[siteId];
        if (!siteLog) return null;
        return (
          <Grid item key={siteId} xs={12} sm={6} md={4}>
            <SiteHourCard siteLog={siteLog} />
          </Grid>
        );
      })}
      <Grid item xs={12}>
        <Typography variant="h6" className="mt-2 text-end">
          Total de horas: {totalHours}
        </Typography>
      </Grid>
    </Grid>
  );
}

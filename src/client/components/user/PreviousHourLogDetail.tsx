import { keys } from 'lodash';
import { useState } from 'react';
import { Grid2 as Grid, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import BasicModal from '~/components/ui/BasicModal';
import EditHourLog from '~/components/user/EditHourLog';
import SiteHourCard from '~/components/user/SiteHourCard';
import { type NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

type Props = {
  hours: HourLogFull;
  month: number;
  year: number;
};
export default function PreviousHourLogDetail({ hours, year, month }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedLog, setSelectedLog] =
    useState<NormalizedHourLogContent | null>(null);

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
    <>
      <Grid size={{ xs: 12 }}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" gutterBottom>
            Horas cargadas previamente
          </Typography>
        </Grid>
        {sites.map((siteId) => {
          const siteLog = hoursBySite[siteId];
          if (!siteLog) return null;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={siteId}>
              <SiteHourCard
                siteLog={siteLog}
                editable={true}
                onEdit={() => {
                  const hourLog = hours[year]![month]![siteId]!;
                  setSelectedLog(hourLog);
                  setOpen(true);
                }}
              />
            </Grid>
          );
        })}
        <Grid size={{ xs: 12 }}>
          <Typography variant="h6" className="mt-2 text-end">
            Total de horas: {totalHours}
          </Typography>
        </Grid>
      </Grid>
      <BasicModal
        title="Editar horas"
        dialogProps={{
          open,
          onClose: () => setOpen(false),
          fullScreen: true,
        }}
      >
        <EditHourLog hourLog={selectedLog} setOpen={setOpen} />
      </BasicModal>
    </>
  );
}

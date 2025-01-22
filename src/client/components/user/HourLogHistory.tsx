'use client';

import { useState } from 'react';
import { capitalize } from 'lodash';
import { Divider, Grid2 as Grid, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import BasicModal from '~/client/components/ui/BasicModal';
import { dayjs, getMonthName } from '~/utils/dayjs';
import EditHourLog from '~/components/user/EditHourLog';
import SiteHourCard from '~/components/user/SiteHourCard';
import { type NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

const isEditable = (month: number, year: number) => {
  const now = dayjs();
  const date = dayjs().year(year).month(month).date(now.date());

  if (now.month() === month && now.year() === year) return true;
  // Allow editing the previous month only if its within the first 5 days of current month
  return now.month() - date.month() === 1 && date.date() <= 5 ? true : false;
};

type Props = {
  hours: HourLogFull;
};
export default function HourLogHistory({ hours }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedLog, setSelectedLog] =
    useState<NormalizedHourLogContent | null>(null);

  const years = Object.keys(hours);

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Historial de horas
      </Typography>
      {!years.length && (
        <Typography variant="body1">
          No hay horas cargadas previamente
        </Typography>
      )}
      <Grid size={{ xs: 12 }}>
        {years.map((year) => {
          const totalYearHours = Object.keys(hours[year] ?? []).reduce(
            (acc, month) => {
              const siteLogs = hours[year]![month]!;
              return (
                acc +
                Object.keys(siteLogs ?? []).reduce((acc, siteId) => {
                  const siteLog = siteLogs[siteId]!;
                  return (
                    acc +
                    siteLog.normalHours +
                    siteLog.saturdayPreHours +
                    siteLog.saturdayPostHours
                  );
                }, 0)
              );
            },
            0,
          );
          return (
            <Grid size={{ xs: 12 }} key={year} spacing={1}>
              <Grid size={{ xs: 12 }}>
                <Divider className="my-2">
                  <Typography variant="h5">{year}</Typography>
                </Divider>
              </Grid>
              <Grid size={{ xs: 12 }} spacing={1}>
                {Object.keys(hours[year] ?? []).map((month) => {
                  const monthLabel = capitalize(getMonthName(+month));
                  const totalMonthHours = Object.keys(
                    hours[year]![month] ?? [],
                  ).reduce((acc, siteId) => {
                    const siteLog = hours[year]![month]![siteId]!;
                    return (
                      acc +
                      siteLog.normalHours +
                      siteLog.saturdayPreHours +
                      siteLog.saturdayPostHours
                    );
                  }, 0);
                  return (
                    <Grid key={month} spacing={2}>
                      <Grid size={{ xs: 1 }}>
                        <Typography variant="h6">{monthLabel}</Typography>
                      </Grid>
                      {Object.keys(hours[year]![month] ?? []).map((siteId) => (
                        <Grid
                          key={`${year}-${month}-${siteId}`}
                          size={{ xs: 12, md: 3 }}
                        >
                          <SiteHourCard
                            key={siteId}
                            siteLog={hours[year]![month]![siteId]!}
                            editable={isEditable(+month, +year)}
                            onEdit={() => {
                              const hourLog = hours[year]![month]![siteId]!;
                              setSelectedLog(hourLog);
                              setOpen(true);
                            }}
                          />
                        </Grid>
                      ))}
                      <Grid size={{ xs: 12 }} className="text-end">
                        <Typography variant="button">
                          Total de horas {monthLabel}: {totalMonthHours}
                        </Typography>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
              <Grid size={{ xs: 12 }} className="mt-2 text-end">
                <Typography variant="h6">
                  Total de horas {year}: {totalYearHours}
                </Typography>
              </Grid>
            </Grid>
          );
        })}
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

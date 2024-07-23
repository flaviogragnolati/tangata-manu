'use client';

import { useState } from 'react';
import { capitalize } from 'lodash';
import { Divider, Grid, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import BasicModal from '~/components/BasicModal';
import { dayjs, getMonthName } from '~/utils/dayjs';
import EditHourLog from '~/components/user/EditHourLog';
import SiteHourCard from '~/components/user/SiteHourCard';
import { type NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

const isEditable = (month: number, year: number) => {
  const date = dayjs().year(year).month(month).date(1);
  // Allow editing only if the month is -1 or +1 from the current month
  return (
    date.isSameOrAfter(dayjs().subtract(1, 'month'), 'month') &&
    date.isSameOrBefore(dayjs().add(1, 'month'), 'month')
  );
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
      <Typography variant="h1" gutterBottom>
        Historial de horas
      </Typography>
      <Grid container xs={12}>
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
            <Grid item container key={year} spacing={1} xs={12}>
              <Grid item xs={12}>
                <Divider className="my-2">
                  <Typography variant="h5">{year}</Typography>
                </Divider>
              </Grid>
              <Grid item container xs={12} spacing={1}>
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
                    <Grid item container key={month} spacing={2}>
                      <Grid item xs={1}>
                        <Typography variant="h6">{monthLabel}</Typography>
                      </Grid>
                      {Object.keys(hours[year]![month] ?? []).map((siteId) => (
                        <Grid
                          item
                          key={`${year}-${month}-${siteId}`}
                          xs={12}
                          md={3}
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
                      <Grid item xs={12} className="text-end">
                        <Typography variant="button">
                          Total de horas {monthLabel}: {totalMonthHours}
                        </Typography>
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
              <Grid item xs={12} className="mt-2 text-end">
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

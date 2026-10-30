'use client';

import { useState } from 'react';
import { capitalize } from 'lodash';
import { Divider, Grid2 as Grid, Typography } from '@mui/material';

import type { HourLogFull } from '~/types';
import { getMonthName } from '~/utils/dayjs';
import {
  isSamePeriod,
  loadablePeriods,
  type Period,
} from '~/client/lib/period';
import EditHourLog from '~/components/user/EditHourLog';
import SiteHourCard from '~/components/user/SiteHourCard';
import { type NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

type Props = {
  hours: HourLogFull;
  sites: { id: number; allowsExtraHours: boolean | null }[];
};
export default function HourLogHistory({ hours, sites }: Props) {
  const [selected, setSelected] = useState<{
    log: NormalizedHourLogContent;
    period: Period;
  } | null>(null);
  const loadable = loadablePeriods();
  const isEditable = (month: number, year: number) =>
    loadable.some((period) => isSamePeriod(period, { year, month }));

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
                            onEdit={() =>
                              setSelected({
                                log: hours[year]![month]![siteId]!,
                                period: { year: +year, month: +month },
                              })
                            }
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
      {selected && (
        <EditHourLog
          key={selected.log.userHourLogId}
          hourLog={selected.log}
          period={selected.period}
          allowsExtraHours={
            !!sites.find((site) => site.id === selected.log.siteId)
              ?.allowsExtraHours
          }
          open
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

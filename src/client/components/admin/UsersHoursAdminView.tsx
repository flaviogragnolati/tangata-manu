'use client';

import { useMemo, useState } from 'react';
import type { SiteRate } from '@prisma/client';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Chip, Grid2 as Grid } from '@mui/material';

import type { HourLogWithUserFull } from '~/types';
import { currentPeriod, isSamePeriod, type Period } from '~/client/lib/period';
import {
  buildUserRateSummaries,
  isOutdatedLog,
} from '~/client/lib/hourLogRates';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import ViewToggle, { type ViewMode } from '~/client/components/ui/ViewToggle';
import FilterBar from '~/client/components/filters/FilterBar';
import UserFilter from '~/client/components/filters/UserFilter';
import MonthStepper from '~/client/components/filters/MonthStepper';
import SiteChipsFilter from '~/client/components/filters/SiteChipsFilter';
import UserRateSummaryCard from '~/components/admin/UserRateSummaryCard';
import HourLogHistoryByUser from '~/components/admin/HourLogHistoryByUser';

type Props = {
  hourLogs: HourLogWithUserFull[];
  users: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  }[];
  activeRates: SiteRate[];
  sites: { id: number; label: string }[];
};

export default function UsersHoursAdminView({
  hourLogs,
  users,
  activeRates,
  sites,
}: Props) {
  const [today] = useState<Period>(() => currentPeriod());
  const [view, setView] = useState<ViewMode>('cards');
  const [period, setPeriod] = useState<Period>(today);
  const [userId, setUserId] = useState<string | null>(null);
  const [siteIds, setSiteIds] = useState<number[]>([]);
  const [allMonths, setAllMonths] = useState(false);

  const userOptions = useMemo(
    () => users.map((u) => ({ id: u.id, label: u.name ?? u.email ?? u.id })),
    [users],
  );

  const summaries = useMemo(
    () =>
      buildUserRateSummaries({
        hourLogs,
        users,
        activeRates,
        period,
        siteIds,
      }).filter((summary) => !userId || summary.userId === userId),
    [hourLogs, users, activeRates, period, siteIds, userId],
  );
  const outdatedCount = summaries.reduce(
    (acc, summary) =>
      acc +
      summary.months.reduce(
        (sum, month) => sum + month.rows.filter((r) => r.isOutdated).length,
        0,
      ),
    0,
  );

  const outdatedIds = useMemo(
    () =>
      new Set(
        hourLogs
          .filter((log) => isOutdatedLog(log, activeRates))
          .map((log) => log.id),
      ),
    [hourLogs, activeRates],
  );
  const rows = hourLogs.filter(
    (log) =>
      (!userId || log.userId === userId) &&
      (!siteIds.length || siteIds.includes(log.SiteRate.siteId)) &&
      (allMonths || isSamePeriod(log, period)),
  );

  const activeCount =
    Number(!!userId) +
    Number(siteIds.length > 0) +
    Number(view === 'table' && allMonths);
  const clearFilters = () => {
    setUserId(null);
    setSiteIds([]);
    setAllMonths(false);
  };

  return (
    <>
      <PageHeader
        title="Horas por usuario"
        subtitle="Horas cargadas por cada usuario en el mes elegido y en el anterior, con la tarifa aplicada a cada registro"
      />
      <FilterBar
        primary={
          <MonthStepper value={period} onChange={setPeriod} max={today} />
        }
        end={<ViewToggle value={view} onChange={setView} />}
        activeCount={activeCount}
        onClear={clearFilters}
      >
        <UserFilter users={userOptions} value={userId} onChange={setUserId} />
        <SiteChipsFilter sites={sites} value={siteIds} onChange={setSiteIds} />
        {view === 'table' && (
          <Chip
            label="Todos los meses"
            clickable
            color={allMonths ? 'primary' : 'default'}
            variant={allMonths ? 'filled' : 'outlined'}
            aria-pressed={allMonths}
            onClick={() => setAllMonths((value) => !value)}
          />
        )}
      </FilterBar>

      {view === 'cards' ? (
        summaries.length ? (
          <>
            {outdatedCount > 0 && (
              <Box sx={{ mb: 2 }}>
                <Chip
                  color="warning"
                  icon={<WarningAmberIcon />}
                  label={`${outdatedCount} ${outdatedCount === 1 ? 'registro' : 'registros'} con tarifa desactualizada`}
                />
              </Box>
            )}
            <Grid container spacing={2}>
              {summaries.map((summary) => (
                <Grid key={summary.userId} size={{ xs: 12, lg: 6 }}>
                  <UserRateSummaryCard summary={summary} />
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <EmptyState title="No hay usuarios que coincidan con los filtros" />
        )
      ) : rows.length ? (
        <HourLogHistoryByUser hourLogs={rows} outdatedIds={outdatedIds} />
      ) : (
        <EmptyState title="No hay registros de horas que coincidan con los filtros" />
      )}
    </>
  );
}

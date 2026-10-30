'use client';

import _ from 'lodash';
import { useMemo, useState } from 'react';
import type { Site, SiteRate, User } from '@prisma/client';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import {
  Box,
  Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import C from '~/constants';
import { dayjs } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import { amountDeltas } from '~/client/lib/salaries';
import { currentPeriod, formatPeriod, type Period } from '~/client/lib/period';
import StatCard from '~/client/components/ui/StatCard';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import FilterBar from '~/client/components/filters/FilterBar';
import MonthStepper from '~/client/components/filters/MonthStepper';
import UserSalaryCard from '~/components/admin/UserSalaryCard';
import SiteSalaryCard from '~/components/admin/SiteSalaryCard';
import type { GroupedSalaries, UserSalariesWithExtraSalary } from '~/types';
import { isFirstHalf } from '~/server/lib/controller/hour.controller';

function getActiveRate(userId: string, siteId: string, rates: SiteRate[]) {
  const rate =
    rates.find(
      (rate) => rate.userId === userId && rate.siteId === parseInt(siteId),
    ) ?? rates.find((rate) => rate.siteId === parseInt(siteId) && !rate.userId);

  return {
    ...(rate ?? {}),
    normalRate: rate?.normalRate ?? 0,
    saturdayPreRate: rate?.saturdayPreRate ?? 0,
    saturdayPostRate: rate?.saturdayPostRate ?? 0,
  };
}

function filterSalaries(
  salaries: UserSalariesWithExtraSalary,
  rates: SiteRate[],
  _filter?: Partial<Filter>,
) {
  const filter = {
    groupBy: _filter?.groupBy ?? 'groupByUser',
    year: _filter?.year ?? dayjs().year(),
    month: _filter?.month ?? dayjs().month(),
  };

  const filteredSalaries: GroupedSalaries = {};
  const extraSalaryByUser: Record<string, number> = {};
  const extraSalaryBySite: Record<string, number> = {};
  let totalAmount = 0;
  let totalHours = 0;
  if (filter.groupBy === 'groupByUser') {
    const salariesByUser = _.groupBy(salaries.userSalaries, 'userId');
    _.forOwn(salariesByUser, (salariesByUser, userId) => {
      if (!salariesByUser?.length) return;

      const filtered = salariesByUser.filter((salary) => {
        const date = dayjs().year(salary.year).month(salary.month);
        if (date.year() === filter.year && date.month() === filter.month) {
          totalAmount += salary.totalAmount;
          totalHours += salary.totalHours;
          return true;
        }
        return false;
      });
      filteredSalaries[userId] = filtered.length > 0 ? filtered : null;
    });

    const half = isFirstHalf(filter.month) ? 'first' : 'second';
    // sum all salaries for the user in the `half` of the year
    _.forOwn(
      _.groupBy(salaries.extraSalaries, 'userId'),
      (extraSalaries, userId) => {
        if (!extraSalaryByUser[userId]) {
          extraSalaryByUser[userId] = 0;
        }
        extraSalaries
          .filter((extraSalary) => extraSalary.year === filter.year)
          .forEach((extraSalary) => {
            const rate = getActiveRate(userId, extraSalary.siteId, rates);
            const extra = extraSalary[half];
            const normalAmount = extra.normalHours * rate.normalRate;
            const saturdayPreAmount =
              extra.saturdayPreHours * rate.saturdayPreRate;
            const saturdayPostAmount =
              extra.saturdayPostHours * rate.saturdayPostRate;
            const amount =
              normalAmount + saturdayPreAmount + saturdayPostAmount;

            extraSalaryByUser[userId]! += amount;
          });
      },
    );
  } else if (filter.groupBy === 'groupBySite') {
    const salariesBySite = _.groupBy(salaries.userSalaries, 'siteId');
    _.forOwn(salariesBySite, (salaries, siteId) => {
      const filtered = (filteredSalaries[siteId] = salaries.filter((salary) => {
        const date = dayjs().year(salary.year).month(salary.month);
        if (date.year() === filter.year && date.month() === filter.month) {
          totalAmount += salary.totalAmount;
          totalHours += salary.totalHours;
          return true;
        }
        return false;
      }));
      filteredSalaries[siteId] = filtered.length > 0 ? filtered : null;
    });

    const half = isFirstHalf(filter.month) ? 'first' : 'second';
    // sum all salaries for the site in the `half` of the year
    _.forOwn(
      _.groupBy(salaries.extraSalaries, 'siteId'),
      (extraSalaries, siteId) => {
        if (!extraSalaryBySite[siteId]) {
          extraSalaryBySite[siteId] = 0;
        }
        extraSalaries
          .filter((extraSalary) => extraSalary.year === filter.year)
          .forEach((extraSalary) => {
            const rate = getActiveRate(extraSalary.userId, siteId, rates);
            const extra = extraSalary[half];
            const normalAmount = extra.normalHours * rate.normalRate;
            const saturdayPreAmount =
              extra.saturdayPreHours * rate.saturdayPreRate;
            const saturdayPostAmount =
              extra.saturdayPostHours * rate.saturdayPostRate;
            const amount =
              normalAmount + saturdayPreAmount + saturdayPostAmount;

            extraSalaryBySite[siteId]! += amount;
          });
      },
    );
  }

  const isEmpty = _.every(filteredSalaries, (salaries) => salaries === null);
  return {
    filteredSalaries,
    extraSalaryByUser,
    extraSalaryBySite,
    totalAmount,
    totalHours,
    isEmpty,
  };
}

type GroupBy = 'groupByUser' | 'groupBySite';

type Filter = {
  groupBy: GroupBy;
  year: number;
  month: number;
};

type Props = {
  salaries: UserSalariesWithExtraSalary;
  users: User[];
  sites: Site[];
  rates: SiteRate[];
};

export default function SalariesDashboard({
  salaries,
  users,
  sites,
  rates,
}: Props) {
  const [today] = useState<Period>(() => currentPeriod());
  const [period, setPeriod] = useState<Period>(today);
  const [groupBy, setGroupBy] = useState<GroupBy>('groupByUser');

  const usersById = useMemo(() => _.keyBy(users, 'id'), [users]);
  const sitesById = useMemo(() => _.keyBy(sites, 'id'), [sites]);

  const {
    filteredSalaries,
    extraSalaryByUser,
    extraSalaryBySite,
    totalAmount,
    totalHours,
    isEmpty,
  } = useMemo(
    () =>
      filterSalaries(salaries, rates, {
        groupBy,
        year: period.year,
        month: period.month,
      }),
    [salaries, rates, groupBy, period],
  );

  const byUser = groupBy === 'groupByUser';
  const deltas = useMemo(
    () =>
      amountDeltas(salaries.userSalaries, byUser ? 'userId' : 'siteId', period),
    [salaries.userSalaries, byUser, period],
  );
  const extraSalaries = byUser ? extraSalaryByUser : extraSalaryBySite;
  const totalExtraSalary = _.sum(Object.values(extraSalaries));
  const entriesCount = _.filter(filteredSalaries, Boolean).length;
  const periodLabel = formatPeriod(period, C.months);

  return (
    <>
      <PageHeader title="Salarios" subtitle={periodLabel} />
      <FilterBar
        primary={
          <MonthStepper
            value={period}
            onChange={setPeriod}
            max={{ year: today.year + 1, month: 11 }}
          />
        }
        end={
          <ToggleButtonGroup
            exclusive
            size="small"
            value={groupBy}
            onChange={(_event, next: GroupBy | null) =>
              next && setGroupBy(next)
            }
            aria-label="Agrupar por"
          >
            <ToggleButton value="groupByUser" aria-label="Por usuario">
              <PersonIcon fontSize="small" />
              <Box
                component="span"
                sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}
              >
                Por usuario
              </Box>
            </ToggleButton>
            <ToggleButton value="groupBySite" aria-label="Por sitio">
              <PlaceIcon fontSize="small" />
              <Box
                component="span"
                sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}
              >
                Por sitio
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Total horas"
            value={totalHours}
            icon={<ScheduleOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Total a pagar"
            value={ARSformatter.format(totalAmount)}
            delta={deltas.total}
            icon={<PaymentsOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label="Aguinaldo acumulado"
            value={ARSformatter.format(totalExtraSalary)}
            hint={`${isFirstHalf(period.month) ? '1er' : '2do'} semestre ${period.year}`}
            icon={<SavingsOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            label={byUser ? 'Usuarios' : 'Sitios'}
            value={entriesCount}
            icon={<GroupOutlinedIcon />}
          />
        </Grid>
      </Grid>
      {isEmpty ? (
        <EmptyState title={`No hay horas cargadas en ${periodLabel}`} />
      ) : (
        <Grid container spacing={2}>
          {byUser ? (
            <SalaryByUser
              usersById={usersById}
              data={filteredSalaries}
              extraSalaries={extraSalaryByUser}
              deltas={deltas.byKey}
            />
          ) : (
            <SalaryBySite
              sitesById={sitesById}
              data={filteredSalaries}
              extraSalaries={extraSalaryBySite}
              deltas={deltas.byKey}
            />
          )}
        </Grid>
      )}
    </>
  );
}

function SalaryByUser({
  data,
  usersById,
  extraSalaries,
  deltas,
}: {
  data: GroupedSalaries;
  usersById: Record<string, User>;
  extraSalaries: Record<string, number>; // {[userId: string]: number}
  deltas: Record<string, number | null>;
}) {
  const userIds = _.keys(data);

  return (
    <>
      {userIds.map((userId) => {
        const user = usersById[userId];
        const filteredSalaries = data[userId];
        if (!user || !filteredSalaries) return null;
        return (
          <Grid key={userId} size={{ xs: 12, sm: 6, lg: 4 }}>
            <UserSalaryCard
              user={user}
              salary={filteredSalaries}
              extraSalary={extraSalaries[userId] ?? 0}
              delta={deltas[userId]}
            />
          </Grid>
        );
      })}
    </>
  );
}

function SalaryBySite({
  data,
  sitesById,
  extraSalaries,
  deltas,
}: {
  data: GroupedSalaries;
  sitesById: Record<string, Site>;
  extraSalaries: Record<string, number>; // {[siteId: string]: number}
  deltas: Record<string, number | null>;
}) {
  const siteIds = _.keys(data);

  return (
    <>
      {siteIds.map((siteId) => {
        const site = sitesById[siteId];
        const filteredSalaries = data[siteId];
        const extraSalary = extraSalaries[siteId];
        if (!site || !filteredSalaries) return null;
        return (
          <Grid key={siteId} size={{ xs: 12, sm: 6, lg: 4 }}>
            <SiteSalaryCard
              site={site}
              salary={filteredSalaries}
              extraSalary={extraSalary}
              delta={deltas[siteId]}
            />
          </Grid>
        );
      })}
    </>
  );
}

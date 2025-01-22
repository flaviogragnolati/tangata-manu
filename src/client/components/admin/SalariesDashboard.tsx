'use client';

import _ from 'lodash';
import { useEffect, useState, useMemo } from 'react';
import type { Site, SiteRate, User } from '@prisma/client';
import { Button, Divider, Grid2 as Grid, Typography } from '@mui/material';
import {
  useForm,
  useWatch,
  SelectElement,
  ToggleButtonGroupElement,
} from 'react-hook-form-mui';

import C from '~/constants';
import { dayjs } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import FormContainer from '~/components/form/FormContainer';
import UserSalaryCard from '~/components/admin/UserSalaryCard';
import SiteSalaryCard from '~/components/admin/SiteSalaryCard';
import type { GroupedSalaries, UserSalariesWithExtraSalary } from '~/types';

function getExtraSalaryRate(
  userId: string,
  rates: SiteRate[],
  salariesByUser: UserSalariesWithExtraSalary['userSalaries'],
) {
  const siteHours = salariesByUser.reduce(
    (acc, curr) => {
      if (acc[curr.siteId]) {
        acc[curr.siteId]! += curr.totalHours;
      } else {
        acc[curr.siteId] = curr.totalHours;
      }
      return acc;
    },
    {} as Record<number | string, number | undefined>,
  );
  // get the site with the highest hours
  const mostFrequentSiteForUser = _.maxBy(
    _.keys(siteHours),
    (siteId) => siteHours[siteId],
  );

  const rate =
    rates.find((rate) => rate.userId === userId) ?? mostFrequentSiteForUser
      ? rates.find((rate) => rate.siteId === parseInt(mostFrequentSiteForUser!))
      : rates.find((rate) => rate.id === parseInt(salariesByUser[0]!.siteId));

  const rateValue =
    rate?.normalRate ?? rate?.saturdayPreRate ?? rate?.saturdayPostRate ?? 0;

  return rateValue;
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
  let totalAmount = 0;
  let totalHours = 0;
  if (filter.groupBy === 'groupByUser') {
    const salariesByUser = _.groupBy(salaries.userSalaries, 'userId');
    _.forOwn(salariesByUser, (salariesByUser, userId) => {
      if (!salariesByUser?.length) return;
      const extraSalaryAcc = salaries.userExtraSalaries.reduce(
        (acc, extraSalary) => {
          if (filter.month <= 5) {
            // should sum all the extra salaries for the user from year=filter.year, and from month=0 to month=filter.month

            if (
              extraSalary[0] === userId &&
              extraSalary[1] === filter.year &&
              extraSalary[2] >= 0 &&
              extraSalary[2] <= filter.month
            ) {
              return extraSalary[3] + acc;
            }
          } else if (filter.month > 5) {
            // should sum all the extra salaries for the user from year=filter.year, and from month=5 to month=11

            if (
              extraSalary[0] === userId &&
              extraSalary[1] === filter.year &&
              extraSalary[2] > 5 &&
              extraSalary[2] <= filter.month
            ) {
              return extraSalary[3] + acc;
            }
          }
          return acc;
        },
        0,
      );
      extraSalaryByUser[userId] =
        extraSalaryAcc * getExtraSalaryRate(userId, rates, salariesByUser);

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
  }

  const isEmpty = _.isEmpty(filteredSalaries);
  return {
    filteredSalaries,
    extraSalaryByUser,
    totalAmount,
    totalHours,
    isEmpty,
  };
}

const generateYearOptions = (currentYear: number) => {
  const years = [];
  for (let i = 2024; i <= currentYear + 1; i++) {
    years.push({ id: i, label: i });
  }
  return years;
};

const monthOptions = C.months.map((month, index) => ({
  id: index,
  label: month,
}));

type Filter = {
  groupBy: 'groupByUser' | 'groupBySite';
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
  const [data, setData] = useState<GroupedSalaries>({});
  const [extraSalaries, setExtraSalaries] = useState<Record<string, number>>(
    {},
  );
  const [isEmpty, setIsEmpty] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  const usersById = useMemo(() => _.keyBy(users, 'id'), [users]);
  const sitesById = useMemo(() => _.keyBy(sites, 'id'), [sites]);

  const NOW = dayjs();
  const currentYear = NOW.year();
  const currentMonth = NOW.month();

  const methods = useForm<Filter>({
    mode: 'onBlur',
    defaultValues: {
      groupBy: 'groupByUser',
      year: currentYear,
      month: currentMonth,
    },
  });

  const filter = useWatch<Filter>({ control: methods.control });

  useEffect(() => {
    const {
      filteredSalaries,
      extraSalaryByUser,
      totalAmount,
      totalHours,
      isEmpty,
    } = filterSalaries(salaries, rates, filter);

    setIsEmpty(isEmpty);
    setExtraSalaries(extraSalaryByUser);
    setData(filteredSalaries);
    setTotalAmount(totalAmount);
    setTotalHours(totalHours);
  }, [filter, salaries, rates]);

  const getDataDisplay = (
    filter?: Partial<Filter>,
    isEmpty?: boolean | null,
  ) => {
    if (isEmpty ?? !filter?.groupBy) {
      return <Typography>No hay datos para mostrar</Typography>;
    }

    switch (filter.groupBy) {
      case 'groupBySite': {
        return (
          <>
            <SalaryBySite
              sitesById={sitesById}
              data={data}
              totalAmount={totalAmount}
              totalHours={totalHours}
            />
            <TotalsComponent
              totalAmount={totalAmount}
              totalHours={totalHours}
            />
          </>
        );
      }
      default:
      case 'groupByUser': {
        return (
          <>
            <SalaryByUser
              usersById={usersById}
              data={data}
              totalAmount={totalAmount}
              totalHours={totalHours}
              extraSalaries={extraSalaries}
            />
            <TotalsComponent
              totalAmount={totalAmount}
              totalHours={totalHours}
            />
          </>
        );
      }
    }
  };

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Salarios
      </Typography>
      <FormContainer<Filter>
        formContext={methods}
        onSuccess={() => {
          return void 0;
        }}
        FormProps={{
          className: 'flex flex-col',
        }}
      >
        <Grid
          container
          rowSpacing={2}
          size={{ xs: 12, sm: 10, md: 8 }}
          alignItems="center"
          alignSelf="center"
          textAlign="center"
          direction="column"
        >
          <Grid size={{ xs: 12 }}>
            <ToggleButtonGroupElement
              name="groupBy"
              label="Agrupar datos por:"
              enforceAtLeastOneSelected
              exclusive
              color="info"
              options={[
                { id: 'groupByUser', label: 'Agrupar por usuario' },
                { id: 'groupBySite', label: 'Agrupar por sitio' },
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Button
              color="primary"
              variant="contained"
              type="submit"
              fullWidth
              onClick={() => {
                methods.setValue('year', currentYear, { shouldValidate: true });
                methods.setValue('month', currentMonth, {
                  shouldValidate: true,
                });
              }}
            >
              HOY
            </Button>
          </Grid>
          <Grid container size={{ xs: 12 }} direction="row" spacing={1}>
            <Grid size={{ xs: 6 }}>
              <SelectElement
                label="Año"
                name="year"
                options={generateYearOptions(currentYear)}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <SelectElement
                label="Mes"
                name="month"
                options={monthOptions}
                fullWidth
              />
            </Grid>
          </Grid>
        </Grid>
      </FormContainer>
      <Divider className="py-2">
        <Typography variant="h6">
          Datos para {C.months[filter.month!]} de {filter.year}
        </Typography>
      </Divider>
      <Grid container spacing={2}>
        {getDataDisplay(filter, isEmpty)}
      </Grid>
    </>
  );
}

function SalaryByUser({
  data,
  usersById,
  extraSalaries,
}: {
  data: GroupedSalaries;
  usersById: Record<string, User>;
  extraSalaries: Record<string, number>;
  totalHours: number;
  totalAmount: number;
}) {
  const userIds = _.keys(data);

  return (
    <>
      {userIds.map((userId) => {
        const user = usersById[userId];
        const filteredSalaries = data[userId];
        if (!user || !filteredSalaries) return null;
        return (
          <Grid key={userId} size={{ xs: 12, sm: 6, md: 4 }}>
            <UserSalaryCard
              user={user}
              salary={filteredSalaries}
              extraSalary={extraSalaries[userId]}
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
}: {
  data: GroupedSalaries;
  sitesById: Record<string, Site>;
  totalHours: number;
  totalAmount: number;
}) {
  const siteIds = _.keys(data);

  return (
    <>
      {siteIds.map((siteId) => {
        const site = sitesById[siteId];
        const filteredSalaries = data[siteId];
        if (!site || !filteredSalaries) return null;
        return (
          <Grid key={siteId} size={{ xs: 12, sm: 6, md: 4 }}>
            <SiteSalaryCard site={site} salary={filteredSalaries} />
          </Grid>
        );
      })}
    </>
  );
}

function TotalsComponent({
  totalHours,
  totalAmount,
}: {
  totalHours: number;
  totalAmount: number;
}) {
  return (
    <Grid
      size={{ xs: 12 }}
      direction="column"
      alignContent="end"
      alignItems="end"
      alignSelf="center"
    >
      <Grid size={{ xs: 12 }}>
        <Typography variant="h5" gutterBottom>
          Total de horas: {totalHours}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h5" gutterBottom>
          Total Monto: {ARSformatter.format(totalAmount)}
        </Typography>
      </Grid>
    </Grid>
  );
}

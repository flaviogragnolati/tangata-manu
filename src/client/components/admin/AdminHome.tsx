'use client';

import { Grid2 as Grid, Typography } from '@mui/material';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import C from '~/constants';
import { ARSformatter } from '~/utils/helpers';
import { formatPeriod, type Period } from '~/client/lib/period';
import type { summarizeSalaries } from '~/client/lib/summaries';
import NavTiles from '~/client/components/ui/NavTiles';
import StatCard from '~/client/components/ui/StatCard';
import PageHeader from '~/client/components/ui/PageHeader';

type Props = {
  userName: string | null;
  period: Period;
  summary: ReturnType<typeof summarizeSalaries>;
  sitesWithoutRate: { id: number; name: string }[];
};

export default function AdminHome({
  userName,
  period,
  summary,
  sitesWithoutRate,
}: Props) {
  const missingRates = sitesWithoutRate.length;

  return (
    <>
      <PageHeader
        title={userName ? `Hola, ${userName}` : 'Hola'}
        subtitle={`Resumen de ${formatPeriod(period, C.months)}`}
      />
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Horas cargadas"
            value={summary.totalHours}
            icon={<ScheduleOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Total a pagar"
            value={ARSformatter.format(summary.totalAmount)}
            icon={<PaymentsOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Usuarios que cargaron"
            value={summary.usersCount}
            icon={<GroupOutlinedIcon />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Sitios sin tarifa del sitio"
            value={missingRates}
            tone={missingRates > 0 ? 'warning' : 'default'}
            icon={<WarningAmberOutlinedIcon />}
            href="/admin/site-rate"
            hint={
              missingRates > 0
                ? sitesWithoutRate.map((site) => site.name).join(', ')
                : 'Todos los sitios tienen tarifa vigente'
            }
          />
        </Grid>
      </Grid>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Accesos
      </Typography>
      <NavTiles area="admin" />
    </>
  );
}

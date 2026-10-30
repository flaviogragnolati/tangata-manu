'use client';

import Link from 'next/link';
import { Box, Button, Card, Typography } from '@mui/material';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';

import C from '~/constants';
import { ARSformatter } from '~/utils/helpers';
import { formatPeriod, type Period } from '~/client/lib/period';
import type { summarizeUserPeriod } from '~/client/lib/summaries';
import NavTiles from '~/client/components/ui/NavTiles';
import StatCard from '~/client/components/ui/StatCard';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';

type Props = {
  userName: string | null;
  period: Period;
  summary: ReturnType<typeof summarizeUserPeriod>;
};

export default function UserHome({ userName, period, summary }: Props) {
  const hasHours = summary.sitesCount > 0;

  return (
    <>
      <PageHeader
        title={userName ? `Hola, ${userName}` : 'Hola'}
        subtitle={formatPeriod(period, C.months)}
      />
      <Box sx={{ mb: 4 }}>
        {hasHours ? (
          <StatCard
            label="Este mes"
            value={`${summary.totalHours} h · ${ARSformatter.format(summary.totalAmount)}`}
            hint={`En ${summary.sitesCount} ${summary.sitesCount === 1 ? 'sitio' : 'sitios'}`}
            icon={<ScheduleOutlinedIcon />}
            href="/user/hour-log-history"
          />
        ) : (
          <Card>
            <EmptyState
              dense
              title="Todavía no cargó horas este mes"
              action={
                <Button
                  component={Link}
                  href="/user/hour-log"
                  variant="contained"
                >
                  Cargar horas
                </Button>
              }
            />
          </Card>
        )}
      </Box>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Accesos
      </Typography>
      <NavTiles area="user" />
    </>
  );
}

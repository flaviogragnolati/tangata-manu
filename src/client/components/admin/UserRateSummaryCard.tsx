'use client';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Grid2 as Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import C from '~/constants';
import { ARSformatter } from '~/utils/helpers';
import { formatPeriod } from '~/client/lib/period';
import type {
  MonthSummary,
  RateRow,
  UserRateSummary,
} from '~/client/lib/hourLogRates';
import EmptyState from '~/client/components/ui/EmptyState';
import UserAvatar from '~/client/components/ui/UserAvatar';

const OUTDATED_HINT =
  'La tarifa con la que se calcularon estas horas ya no es la que corresponde hoy a este usuario en este sitio';

export function OutdatedRateChip() {
  return (
    <Tooltip title={OUTDATED_HINT}>
      <Chip
        size="small"
        color="warning"
        icon={<WarningAmberIcon />}
        label="Tarifa desactualizada"
      />
    </Tooltip>
  );
}

function appliedRateText(row: RateRow) {
  const parts = [`${ARSformatter.format(row.appliedRate.normal)}/h`];
  for (const type of ['saturdayPre', 'saturdayPost'] as const) {
    if (row.hours[type] > 0) {
      parts.push(
        `${C.rateTypesMap[type]}: ${ARSformatter.format(row.appliedRate[type])}/h`,
      );
    }
  }
  return parts.join(' · ');
}

function MonthColumn({ month }: { month: MonthSummary }) {
  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      <Typography variant="overline" color="text.secondary">
        {formatPeriod(month.period, C.months)}
      </Typography>
      {month.rows.length === 0 ? (
        <EmptyState dense title="Sin carga" />
      ) : (
        <Stack spacing={1.5} divider={<Divider flexItem />} sx={{ flex: 1 }}>
          {month.rows.map((row) => (
            <Box key={row.hourLogId}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}
              >
                <Tooltip title={row.siteName}>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ fontWeight: 600, minWidth: 0 }}
                  >
                    {row.siteName}
                  </Typography>
                </Tooltip>
                <Typography variant="body2" sx={{ flexShrink: 0 }}>
                  {row.hours.total} h · {ARSformatter.format(row.amount)}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
              >
                {appliedRateText(row)}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ mt: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}
              >
                {row.scope === 'user' ? (
                  <Chip size="small" color="secondary" label="Por usuario" />
                ) : (
                  <Chip size="small" variant="outlined" label="Del sitio" />
                )}
                {row.isOutdated && <OutdatedRateChip />}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        Total {month.totalHours} h · {ARSformatter.format(month.totalAmount)}
      </Typography>
    </Stack>
  );
}

export default function UserRateSummaryCard({
  summary,
}: {
  summary: UserRateSummary;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={
          <UserAvatar
            name={summary.name}
            email={summary.email}
            image={summary.image}
          />
        }
        title={summary.name ?? summary.email}
        subheader={summary.name ? summary.email : undefined}
        slotProps={{
          title: { noWrap: true },
          subheader: { noWrap: true },
        }}
        sx={{ '& .MuiCardHeader-content': { minWidth: 0 } }}
      />
      <Divider />
      <CardContent>
        <Grid container spacing={3}>
          {summary.months.map((month) => (
            <Grid
              key={`${month.period.year}-${month.period.month}`}
              size={{ xs: 12, sm: 6 }}
            >
              <MonthColumn month={month} />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

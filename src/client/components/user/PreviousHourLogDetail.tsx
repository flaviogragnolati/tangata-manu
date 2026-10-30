'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import C from '~/constants';
import type { HourLogFull } from '~/types';
import { ARSformatter } from '~/utils/helpers';
import { type Period } from '~/client/lib/period';
import EditHourLog from '~/components/user/EditHourLog';
import type { NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

type Props = {
  hours: HourLogFull;
  period: Period;
  sites: { id: number; allowsExtraHours: boolean | null }[];
};

const logHours = (log: NormalizedHourLogContent) =>
  log.normalHours + log.saturdayPreHours + log.saturdayPostHours;
const logAmount = (log: NormalizedHourLogContent) =>
  log.normalAmount + log.saturdayPreAmount + log.saturdayPostAmount;

/** "Ya cargado" for the chosen period; only shown for loadable periods, so always editable. */
export default function PreviousHourLogDetail({ hours, period, sites }: Props) {
  const [selected, setSelected] = useState<NormalizedHourLogContent | null>(
    null,
  );
  const logs = Object.values(hours[period.year]?.[period.month] ?? {});
  if (!logs.length) return null;

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Ya cargado en {C.months[period.month]}
        </Typography>
        <Stack divider={<Divider flexItem />} spacing={1}>
          {logs.map((log) => (
            <Stack
              key={log.userHourLogId}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center' }}
            >
              <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {log.siteName}
              </Typography>
              <Typography variant="body2" sx={{ flexShrink: 0 }}>
                {logHours(log)} h · {ARSformatter.format(logAmount(log))}
              </Typography>
              <Button size="small" onClick={() => setSelected(log)}>
                Editar
              </Button>
            </Stack>
          ))}
        </Stack>
      </CardContent>
      {selected && (
        <EditHourLog
          key={selected.userHourLogId}
          hourLog={selected}
          period={period}
          allowsExtraHours={
            !!sites.find((site) => site.id === selected.siteId)
              ?.allowsExtraHours
          }
          open
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}

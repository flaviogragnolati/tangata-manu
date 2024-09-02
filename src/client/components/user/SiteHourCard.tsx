'use client';

import Edit from '@mui/icons-material/Edit';
import {
  Typography,
  Card,
  CardContent,
  Stack,
  IconButton,
} from '@mui/material';
import { ARSformatter } from '~/utils/helpers';
import { NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

type Props = {
  siteLog: NormalizedHourLogContent;
  editable?: boolean;
  onEdit?: () => void;
};
export default function SiteHourCard({ siteLog, editable, onEdit }: Props) {
  const {
    siteName,
    normalHours,
    saturdayPreHours,
    saturdayPostHours,
    normalAmount,
    saturdayPreAmount,
    saturdayPostAmount,
  } = siteLog;
  const totalHours = normalHours + saturdayPreHours + saturdayPostHours;
  const totalAmount = normalAmount + saturdayPreAmount + saturdayPostAmount;
  return (
    <Card sx={{ maxWidth: 500 }} className="m-2 bg-slate-50">
      <CardContent>
        <Stack spacing={2} direction="column">
          {editable ? (
            <Stack direction="row">
              <Typography variant="h6">{siteName}</Typography>
              <IconButton color="secondary" className="ml-2" onClick={onEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </Stack>
          ) : (
            <Typography variant="h6" gutterBottom>
              {siteName}
            </Typography>
          )}
          <Typography variant="body1" gutterBottom>
            Horas normales:{' '}
            <strong>
              {normalHours} ({ARSformatter.format(normalAmount)})
            </strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            Horas sábado previo 14:00:{' '}
            <strong>
              {saturdayPreHours} ({ARSformatter.format(saturdayPreAmount)})
            </strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            Horas sábado pasadas 14:00:{' '}
            <strong>
              {saturdayPostHours} ({ARSformatter.format(saturdayPostAmount)})
            </strong>
          </Typography>
          <Typography variant="button" className="text-end">
            Horas totales:{' '}
            <strong>
              {totalHours} ({ARSformatter.format(totalAmount)})
            </strong>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

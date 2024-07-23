'use client';

import Edit from '@mui/icons-material/Edit';
import {
  Typography,
  Card,
  CardContent,
  Stack,
  IconButton,
} from '@mui/material';

type Hour = {
  siteName: string;
  normalHours: number;
  saturdayPreHours: number;
  saturdayPostHours: number;
};
type Props = {
  siteLog: Hour;
  editable?: boolean;
  onEdit?: () => void;
};
export default function SiteHourCard({ siteLog, editable, onEdit }: Props) {
  const { siteName, normalHours, saturdayPreHours, saturdayPostHours } =
    siteLog;
  const totalHours = normalHours + saturdayPreHours + saturdayPostHours;
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
            Horas normales: <strong>{normalHours}</strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            Horas sábado previo 14:00: <strong>{saturdayPreHours}</strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            Horas sábado pasadas 14:00: <strong>{saturdayPostHours}</strong>
          </Typography>
          <Typography variant="button" className="text-end">
            Horas totales: <strong>{totalHours}</strong>
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import { C } from '~/constants';
import { api } from '~/trpc/react';
import { ARSformatter } from '~/utils/helpers';
import { showToast } from '~/client-utils/toast';
import { formatPeriod, type Period } from '~/client/lib/period';
import type { UserHourLogFormInput } from '~/schemas';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
} from '~/client/components/ui/FormDialog';

type Props = {
  open: boolean;
  onClose: () => void;
  period: Period;
  entries: UserHourLogFormInput['hours'];
  onConfirmed: () => void;
};

const HOUR_TYPES = ['normal', 'saturdayPre', 'saturdayPost'] as const;

export default function HourLogConfirmation({
  open,
  onClose,
  period,
  entries,
  onConfirmed,
}: Props) {
  const router = useRouter();
  const input = { ...period, hours: entries };
  const preview = api.hours.previewUserHourLog.useQuery(input, {
    enabled: open,
    retry: false,
  });

  const add = api.hours.addUserHourLog.useMutation({
    onSuccess: () => {
      showToast('success', 'Horas cargadas');
      onConfirmed();
      router.push('/user');
    },
    onError: (error) => showToast('error', error.message),
  });

  const sites = preview.data ?? [];
  const missingRate = sites.some((site) => site.missingRate);
  const totalHours = entries.reduce((acc, entry) => acc + entry.hours, 0);
  const totalAmount = sites.reduce((acc, site) => acc + (site.amount ?? 0), 0);

  return (
    <FormDialog
      open={open}
      title={`Confirmar horas · ${formatPeriod(period, C.months)}`}
      onClose={onClose}
    >
      <DialogContent dividers>
        {preview.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label="Calculando el monto" />
          </Box>
        ) : preview.isError ? (
          <Alert severity="error">{preview.error.message}</Alert>
        ) : (
          <Stack spacing={2}>
            {sites.map((site) => (
              <Card key={site.siteId} variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {site.siteName}
                    </Typography>
                    {HOUR_TYPES.map((type) =>
                      site.newHours[type] > 0 ? (
                        <Typography key={type} variant="body2">
                          {C.rateTypesMap[type]}:{' '}
                          <strong>{site.newHours[type]} h</strong>
                        </Typography>
                      ) : null,
                    )}
                    {site.previousHours > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Ya cargado: {site.previousHours} h · Total del mes:{' '}
                        {site.totalHours} h
                      </Typography>
                    )}
                    {site.amount !== null && (
                      <Typography variant="body2">
                        Monto estimado del mes en este sitio:{' '}
                        <strong>{ARSformatter.format(site.amount)}</strong>
                      </Typography>
                    )}
                    {site.rateChanged && (
                      <Alert severity="info">
                        Las horas que ya tenía cargadas en {site.siteName} este
                        mes se recalculan con la tarifa vigente.
                      </Alert>
                    )}
                    {site.missingRate && (
                      <Alert severity="error">
                        {site.siteName} no tiene tarifa vigente. Avise al
                        administrador.
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
            <Divider />
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
            >
              <Typography>
                Total a cargar: <strong>{totalHours} h</strong>
              </Typography>
              {!missingRate && (
                <Typography>
                  Monto estimado:{' '}
                  <strong>{ARSformatter.format(totalAmount)}</strong>
                </Typography>
              )}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <FormDialogActions>
        <FormDialogCancel label="Volver" />
        <LoadingButton
          variant="contained"
          loading={add.isPending}
          disabled={!preview.data || preview.isFetching || missingRate}
          onClick={() => add.mutate(input)}
        >
          Confirmar
        </LoadingButton>
      </FormDialogActions>
    </FormDialog>
  );
}

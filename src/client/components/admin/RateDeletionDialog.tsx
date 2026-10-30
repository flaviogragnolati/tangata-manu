'use client';

import { useRouter } from 'next/navigation';
import { skipToken } from '@tanstack/react-query';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  CircularProgress,
  DialogContent,
  Stack,
  Typography,
} from '@mui/material';

import { api } from '~/trpc/react';
import type { RouterOutputs } from '~/trpc/shared';
import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import { showToast } from '~/client-utils/toast';
import type { SiteRateFull } from '~/types';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
  FormDialogForm,
} from '~/client/components/ui/FormDialog';

type Preview = RouterOutputs['site']['previewRateDeletion'];

type Props = {
  rate: SiteRateFull | null;
  onClose: () => void;
};

const money = (value: number | null) => ARSformatter.format(value ?? 0);

export default function RateDeletionDialog({ rate, onClose }: Props) {
  const router = useRouter();
  const preview = api.site.previewRateDeletion.useQuery(
    rate ? { siteRateId: rate.id } : skipToken,
    { retry: false },
  );

  const remove = api.site.deleteSiteRate.useMutation({
    onSuccess: (result) => {
      showToast(
        'success',
        `Tarifa borrada${result.restoredRateId ? ' · volvió la anterior' : ''}`,
      );
      router.refresh();
      onClose();
    },
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        showToast('warning', error.message);
        void preview.refetch();
        return;
      }
      showToast('error', error.message);
    },
  });

  if (!rate) return null;

  return (
    <FormDialog
      open
      title="Borrar tarifa"
      subtitle={`${rate.Site.name} · ${rate.userId ? (rate.User?.name ?? rate.User?.email) : 'Tarifa del sitio'}`}
      onClose={onClose}
    >
      <FormDialogForm
        onSubmit={(event) => {
          event.preventDefault();
          if (!preview.data) return;
          remove.mutate({
            siteRateId: rate.id,
            expectedRestoreRateId: preview.data.restoreRate?.id ?? null,
          });
        }}
      >
        <DialogContent dividers>
          {preview.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress aria-label="Revisando la tarifa" />
            </Box>
          ) : preview.isError ? (
            <Alert severity="error">{preview.error.message}</Alert>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {preview.data.rate.siteName} ·{' '}
                {preview.data.rate.userName ?? 'Tarifa del sitio'} ·{' '}
                {money(preview.data.rate.normalRate)}/h
                {(preview.data.rate.saturdayPreRate ?? 0) +
                  (preview.data.rate.saturdayPostRate ?? 0) >
                  0 &&
                  ` · Sábado ${money(preview.data.rate.saturdayPreRate)} / ${money(preview.data.rate.saturdayPostRate)}`}{' '}
                · Cargada el {formatDate(preview.data.rate.createdAt)}
              </Typography>
              <Outcome preview={preview.data} />
              <Typography variant="body2">
                No cambia ningún registro de horas.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <FormDialogActions>
          <FormDialogCancel />
          <LoadingButton
            type="submit"
            variant="contained"
            color="error"
            loading={remove.isPending}
            disabled={!preview.data || preview.isFetching}
          >
            Borrar tarifa
          </LoadingButton>
        </FormDialogActions>
      </FormDialogForm>
    </FormDialog>
  );
}

function Outcome({ preview }: { preview: Preview }) {
  const { outcome, restoreRate, fallbackSiteRate, rate } = preview;
  switch (outcome) {
    case 'inactive':
      return (
        <Typography>
          Es una tarifa inactiva: no cambia ninguna tarifa vigente.
        </Typography>
      );
    case 'restores':
      return (
        <Alert severity="info">
          Vuelve a quedar vigente la tarifa anterior:{' '}
          {money(restoreRate?.normalRate ?? null)}/h (cargada el{' '}
          {restoreRate ? formatDate(restoreRate.createdAt) : '—'}).
        </Alert>
      );
    case 'otherActiveRemains':
      return (
        <Typography>Sigue vigente la otra tarifa del mismo alcance.</Typography>
      );
    case 'leavesScopeEmpty':
      if (!rate.userId) {
        return (
          <Alert severity="warning">
            El sitio queda sin tarifa del sitio vigente. Los usuarios sin tarifa
            por usuario no van a poder cargar horas allí hasta que cargue una
            nueva.
          </Alert>
        );
      }
      return fallbackSiteRate ? (
        <Alert severity="info">
          Pasa a cobrar la tarifa del sitio vigente (
          {money(fallbackSiteRate.normalRate)}/h).
        </Alert>
      ) : (
        <Alert severity="warning">
          El sitio no tiene tarifa del sitio vigente: el usuario no va a poder
          cargar horas allí hasta que cargue una.
        </Alert>
      );
  }
}

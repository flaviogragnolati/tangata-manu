'use client';

import { useRouter } from 'next/navigation';
import { skipToken } from '@tanstack/react-query';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  CircularProgress,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

import C from '~/constants';
import { api } from '~/trpc/react';
import { ARSformatter } from '~/utils/helpers';
import { showToast } from '~/client-utils/toast';
import { formatPeriod } from '~/client/lib/period';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
  FormDialogForm,
} from '~/client/components/ui/FormDialog';

export type UserStatusAction = {
  kind: 'deactivate' | 'reactivate';
  userId: string;
  label: string;
};

type Props = {
  action: UserStatusAction | null;
  onClose: () => void;
};

/** Mount with `key={action?.userId}` so a new user never shows the previous preview. */
export default function UserStatusDialog({ action, onClose }: Props) {
  const router = useRouter();
  const deactivating = action?.kind === 'deactivate';

  const preview = api.user.previewUserDeactivation.useQuery(
    action && deactivating ? { userId: action.userId } : skipToken,
    { retry: false },
  );

  const handlers = (done: string) => ({
    onSuccess: () => {
      showToast('success', done);
      router.refresh();
      onClose();
    },
    onError: (error: { message: string; data?: { code?: string } | null }) => {
      if (error.data?.code === 'CONFLICT') {
        showToast('warning', error.message);
        void preview.refetch();
        return;
      }
      showToast('error', error.message);
    },
  });
  const deactivate = api.user.deactivateUser.useMutation(
    handlers('Usuario dado de baja'),
  );
  const reactivate = api.user.reactivateUser.useMutation(
    handlers('Usuario reactivado'),
  );

  if (!action) return null;

  const pending = deactivate.isPending || reactivate.isPending;

  return (
    <FormDialog
      open
      title={deactivating ? 'Dar de baja' : 'Reactivar'}
      subtitle={action.label}
      onClose={onClose}
    >
      <FormDialogForm
        onSubmit={(event) => {
          event.preventDefault();
          if (!deactivating) {
            reactivate.mutate({ userId: action.userId });
          } else if (preview.data) {
            deactivate.mutate({
              userId: action.userId,
              expectedRateIds: preview.data.activeUserRates.map((r) => r.id),
            });
          }
        }}
      >
        <DialogContent dividers>
          {!deactivating ? (
            <Typography>
              Vuelve a aparecer y a poder cargar horas. Sus tarifas por usuario
              siguen inactivas: cobra la tarifa del sitio hasta que le cargue
              una nueva.
            </Typography>
          ) : preview.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress aria-label="Revisando el usuario" />
            </Box>
          ) : preview.isError ? (
            <Alert severity="error">{preview.error.message}</Alert>
          ) : (
            <Stack spacing={2}>
              <Typography>
                No va a poder cargar ni editar horas. Sus registros de horas,
                salarios y aguinaldo no cambian.
              </Typography>
              {preview.data.activeUserRates.length ? (
                <Box>
                  <Typography variant="subtitle2">
                    Tarifas por usuario vigentes que quedan inactivas
                  </Typography>
                  <List dense disablePadding>
                    {preview.data.activeUserRates.map((rate) => (
                      <ListItem key={rate.id} disableGutters>
                        <ListItemText
                          primary={`${rate.siteName} · ${ARSformatter.format(rate.normalRate ?? 0)}/h`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No tiene tarifas por usuario vigentes.
                </Typography>
              )}
              {preview.data.currentPeriod.hours > 0 && (
                <Alert severity="info">
                  Tiene {preview.data.currentPeriod.hours} h cargadas en{' '}
                  {formatPeriod(preview.data.currentPeriod.period, C.months)} (
                  {ARSformatter.format(preview.data.currentPeriod.amount)}); se
                  siguen mostrando en Salarios.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <FormDialogActions>
          <FormDialogCancel />
          <LoadingButton
            type="submit"
            variant="contained"
            color={deactivating ? 'error' : 'primary'}
            loading={pending}
            disabled={deactivating && (!preview.data || preview.isFetching)}
          >
            {deactivating ? 'Dar de baja' : 'Reactivar'}
          </LoadingButton>
        </FormDialogActions>
      </FormDialogForm>
    </FormDialog>
  );
}

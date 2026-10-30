'use client';

import { useRouter } from 'next/navigation';
import { LoadingButton } from '@mui/lab';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { DialogContent, Stack, Typography } from '@mui/material';

import C from '~/constants';
import { api } from '~/trpc/react';
import { ARSformatter } from '~/utils/helpers';
import { showToast } from '~/client/utils/toast';
import { formatPeriod, type Period } from '~/client/lib/period';
import { computeAmount } from '~/server/lib/rateChanges';
import { updateHourLogSchema, type UpdateHourLog } from '~/schemas';
import type { NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
  FormDialogForm,
} from '~/client/components/ui/FormDialog';
import HoursField from '~/client/components/form/HoursField';

type Props = {
  hourLog: NormalizedHourLogContent;
  period: Period;
  allowsExtraHours: boolean;
  open: boolean;
  onClose: () => void;
};

export default function EditHourLog({
  hourLog,
  period,
  allowsExtraHours,
  open,
  onClose,
}: Props) {
  const router = useRouter();
  const methods = useForm<UpdateHourLog>({
    mode: 'onBlur',
    resolver: zodResolver(updateHourLogSchema),
    defaultValues: {
      id: hourLog.userHourLogId,
      normalHours: hourLog.normalHours,
      saturdayPreHours: hourLog.saturdayPreHours,
      saturdayPostHours: hourLog.saturdayPostHours,
    },
  });
  const { control, handleSubmit, formState } = methods;
  const hours = useWatch({ control });

  // Saturday hours already loaded stay editable even if the site no longer allows them
  const showSaturday =
    allowsExtraHours ||
    hourLog.saturdayPreHours > 0 ||
    hourLog.saturdayPostHours > 0;

  const rate = {
    normalRate: hourLog.rate.normal,
    saturdayPreRate: hourLog.rate.saturdayPre,
    saturdayPostRate: hourLog.rate.saturdayPost,
  };
  const before = computeAmount(hourLog, rate);
  const after = computeAmount(
    {
      normalHours: Number(hours.normalHours) || 0,
      saturdayPreHours: Number(hours.saturdayPreHours) || 0,
      saturdayPostHours: Number(hours.saturdayPostHours) || 0,
    },
    rate,
  );

  const update = api.hours.updateUserHourLog.useMutation({
    onSuccess: () => {
      showToast('success', 'Horas actualizadas');
      router.refresh();
      onClose();
    },
    onError: (error) => showToast('error', error.message),
  });

  return (
    <FormDialog
      open={open}
      title="Editar horas"
      subtitle={`${hourLog.siteName} · ${formatPeriod(period, C.months)}`}
      onClose={onClose}
      dirty={formState.isDirty}
    >
      <FormProvider {...methods}>
        <FormDialogForm
          onSubmit={handleSubmit((values) => update.mutate(values))}
        >
          <DialogContent dividers>
            <Stack spacing={2}>
              <HoursField<UpdateHourLog>
                control={control}
                name="normalHours"
                label={C.rateTypesMap.normal}
              />
              {showSaturday && (
                <>
                  <HoursField<UpdateHourLog>
                    control={control}
                    name="saturdayPreHours"
                    label={C.rateTypesMap.saturdayPre}
                  />
                  <HoursField<UpdateHourLog>
                    control={control}
                    name="saturdayPostHours"
                    label={C.rateTypesMap.saturdayPost}
                  />
                </>
              )}
              <Typography>
                Monto: {ARSformatter.format(before)} →{' '}
                <strong>{ARSformatter.format(after)}</strong>
              </Typography>
            </Stack>
          </DialogContent>
          <FormDialogActions>
            <FormDialogCancel />
            <LoadingButton
              type="submit"
              variant="contained"
              loading={update.isPending}
              disabled={!formState.isDirty}
            >
              Guardar
            </LoadingButton>
          </FormDialogActions>
        </FormDialogForm>
      </FormProvider>
    </FormDialog>
  );
}

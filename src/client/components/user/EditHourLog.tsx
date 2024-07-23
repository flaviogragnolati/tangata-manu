'use client';

import { Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import { FormContainer, TextFieldElement, useForm } from 'react-hook-form-mui';

import { api } from '~/trpc/react';
import { type UpdateHourLog } from '~/schemas';
import { showToast } from '~/client/utils/toast';
import { type NormalizedHourLogContent } from '~/server/lib/controller/hour.controller';

type Props = {
  hourLog: NormalizedHourLogContent | null;
  setOpen: (value: boolean) => void;
};
export default function EditHourLog({ hourLog, setOpen }: Props) {
  const router = useRouter();
  const methods = useForm<UpdateHourLog>({
    mode: 'onBlur',
    defaultValues: {
      id: hourLog?.userHourLogId,
      normalHours: hourLog?.normalHours ?? 0,
      saturdayPreHours: hourLog?.saturdayPreHours ?? 0,
      saturdayPostHours: hourLog?.saturdayPostHours ?? 0,
    },
  });

  const { mutate, isPending, isError, error } =
    api.hours.updateUserHourLog.useMutation({
      onSuccess: () => {
        showToast('success', 'Horas actualizadas correctamente');
        methods.reset();
        setOpen(false);
        router.refresh();
      },
      onError: (error) => {
        showToast('error', error.message);
      },
    });

  const {
    formState: { isValid },
  } = methods;

  if (isError) {
    showToast('error', error.message);
  }

  return (
    <FormContainer<UpdateHourLog>
      formContext={methods}
      onSuccess={(values) => {
        console.log('VALUES', values);
        mutate(values);
      }}
      FormProps={{
        className: 'flex flex-col',
      }}
    >
      <Grid container xs={12} spacing={2} alignSelf="center" textAlign="center">
        <Grid item xs={12}>
          <TextFieldElement
            name="normalHours"
            label="Horas normales"
            type="number"
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextFieldElement
            name="saturdayPreHours"
            label="Horas sábado previo 14:00"
            type="number"
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <TextFieldElement
            name="saturdayPostHours"
            label="Horas sábado pasadas 14:00"
            type="number"
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <LoadingButton
            disabled={!isValid || isPending}
            variant="contained"
            color="success"
            type="submit"
            className="mt-3 max-w-xs self-center"
            loading={isPending}
            size="large"
          >
            Actualizar horas
          </LoadingButton>
        </Grid>
      </Grid>
    </FormContainer>
  );
}

'use client';

import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import { type UseFormReturn } from 'react-hook-form';
import { Button, Divider, Grid, Stack, Typography } from '@mui/material';

import { C } from '~/constants';
import { api } from '~/trpc/react';
import { dayjs } from '~/utils/dayjs';
import type { SiteFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { type UserHourLogFormInput } from '~/schemas';
import { parseConfirmationHours } from '~/server/lib/controller/hour.controller';

type Props = {
  setOpen: (value: boolean) => void;
  hoursBySite: Record<number, UserHourLogFormInput['hours']>;
  useFormMethods: UseFormReturn<UserHourLogFormInput>;
  sites: SiteFull[];
  month: number;
  year: number;
};
export default function HourLogConfirmation({
  hoursBySite,
  setOpen,
  useFormMethods,
  sites,
  month,
  year,
}: Props) {
  const router = useRouter();

  const parsedHours = parseConfirmationHours(hoursBySite, sites);

  const { mutate, isError, error, isPending } =
    api.hours.addUserHourLog.useMutation({
      onSuccess: () => {
        showToast('success', 'Horas cargadas correctamente');
        useFormMethods.reset();
        setOpen(false);
        void router.push('/user');
      },
      onError: (error) => {
        showToast('error', error.message);
        setOpen(false);
      },
    });

  const handleConfirmLoadHours = () => {
    mutate({
      month: month,
      year: year,
      hours: useFormMethods.getValues().hours,
    });
  };

  if (isError) {
    showToast('error', error.message);
  }

  return (
    <Grid
      container
      xs={12}
      md={4}
      gap={2}
      alignItems="center"
      textAlign="center"
      direction="column"
    >
      {parsedHours.map(({ siteId, siteName, ...hours }) => {
        const totalHours = Object.values(hours).reduce(
          (acc, curr) => acc + curr,
          0,
        );
        return (
          <Grid container item key={siteId} xs={12} md={4} spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>
                {siteName}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              {C.rateTypes.map((rate, idx) => {
                const rateHours = hours[rate];
                if (!rateHours) return null;
                return (
                  <Typography key={idx} variant="body1">
                    {C.rateTypesMap[rate]}: <strong>{rateHours} hs</strong>
                  </Typography>
                );
              })}
            </Grid>

            <Grid item xs={12}>
              <Typography
                variant="h6"
                fontWeight={'fontWeightBold'}
                gutterBottom
              >
                Total {siteName}: {totalHours} hs
              </Typography>
            </Grid>
          </Grid>
        );
      })}
      <Divider flexItem sx={{ mr: '-1px' }} />
      <Grid item>
        <Typography variant="h5" className="self-center">
          Total a cargar para {dayjs().month(month).format('MMMM')} de {year}:{' '}
          <strong>
            {Object.values(hoursBySite).reduce((acc, curr) => {
              return acc + curr.reduce((acc, curr) => acc + curr.hours, 0);
            }, 0)}{' '}
            hs{' '}
          </strong>
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Stack direction="row" gap={2} className="self-center">
          <Button
            variant="outlined"
            color="secondary"
            className="mt-3 max-w-xs self-center"
            onClick={() => setOpen(false)}
            disabled={!useFormMethods.formState.isValid || isPending}
            size="large"
          >
            Volver
          </Button>
          <LoadingButton
            loading={isPending}
            disabled={!useFormMethods.formState.isValid}
            variant="contained"
            color="success"
            className="mt-3 max-w-xs self-center"
            onClick={handleConfirmLoadHours}
            size="large"
          >
            Confirmar
          </LoadingButton>
        </Stack>
      </Grid>
    </Grid>
  );
}

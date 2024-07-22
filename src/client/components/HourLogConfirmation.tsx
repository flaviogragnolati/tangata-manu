'use client';

import { LoadingButton } from '@mui/lab';
import { type UseFormReturn } from 'react-hook-form';
import { Button, Divider, Stack, Typography } from '@mui/material';

import { C } from '~/constants';
import { api } from '~/trpc/react';
import { dayjs } from '~/utils/dayjs';
import type { SiteFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { type UserHourLogFormInput } from '~/schemas';

type Props = {
  setOpen: (value: boolean) => void;
  hoursBySite: Record<number, UserHourLogFormInput['hours']>;
  useFormMethods: UseFormReturn<UserHourLogFormInput>;
  sites: SiteFull[];
};
export default function HourLogConfirmation({
  hoursBySite,
  setOpen,
  useFormMethods,
  sites,
}: Props) {
  const { mutate, isError, error, isPending, isSuccess } =
    api.hours.addUserHourLog.useMutation({
      onSuccess: () => {
        showToast('success', 'Horas cargadas correctamente');
        useFormMethods.reset();
        setOpen(false);
      },
      onError: (error) => {
        showToast('error', error.message);
        setOpen(false);
      },
    });

  const handleConfirmLoadHours = () => {
    mutate({
      month: dayjs().month(),
      year: dayjs().year(),
      hours: useFormMethods.getValues().hours,
    });
  };

  if (isError) {
    showToast('error', error.message);
  }

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(hoursBySite).map(([siteId, hours]) => {
        const site = sites.find((site) => site.id === Number(siteId))!;
        return (
          <div key={siteId} className="flex flex-col gap-2">
            <Typography variant="h4">{site?.name}</Typography>
            <Stack direction="row" gap={2}>
              {hours.map((hour, idx) => (
                <div key={idx} className="flex gap-2">
                  <Typography>{C.rateTypesMap[hour.rate]}:</Typography>
                  <Typography fontWeight={'fontWeightBold'}>
                    {hour.hours} hs
                  </Typography>
                </div>
              ))}
            </Stack>
            <Typography variant="h6" fontWeight={'fontWeightBold'} gutterBottom>
              Total {site?.name}:{' '}
              {hours.reduce((acc, curr) => acc + curr.hours, 0)} hs
            </Typography>
          </div>
        );
      })}
      <Divider />
      <Typography
        variant="h5"
        fontWeight={'fontWeightBold'}
        className="self-center"
      >
        Total final:{' '}
        {Object.values(hoursBySite).reduce((acc, curr) => {
          return acc + curr.reduce((acc, curr) => acc + curr.hours, 0);
        }, 0)}{' '}
        hs
      </Typography>
      <Stack direction="row" gap={2} className="self-center">
        <Button
          variant="outlined"
          color="secondary"
          className="mt-3 max-w-xs self-center"
          onClick={() => setOpen(false)}
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
        >
          Confirmar
        </LoadingButton>
      </Stack>
    </div>
  );
}

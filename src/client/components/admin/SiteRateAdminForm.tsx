'use client';

import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Divider, Grid2 as Grid, Typography } from '@mui/material';
import { DatePickerElement } from 'react-hook-form-mui/date-pickers';
import {
  useForm,
  type SubmitHandler,
  TextFieldElement,
  SelectElement,
  SwitchElement,
  AutocompleteElement,
} from 'react-hook-form-mui';

import { api } from '~/trpc/react';
import { dayjs } from '~/utils/dayjs';
import { type SiteRateFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { siteRateSchema, type SiteRate } from '~/schemas';
import FormContainer from '~/client/components/form/FormContainer';

type Props = {
  rate?: SiteRateFull | null;
  siteOptions: { id: number; label: string; allowsExtraHours: boolean }[];
  userOptions: { id: string; label: string }[];
  setOpen: (value: boolean) => void;
};

export default function SiteRateAdminForm({
  rate,
  siteOptions,
  userOptions,
  setOpen,
}: Props) {
  const router = useRouter();
  const isEdit = !!rate?.id;
  const defaultValues = (rate ?? { active: true }) as SiteRate;
  const methods = useForm<SiteRate>({
    mode: 'onBlur',
    resolver: zodResolver(siteRateSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const selectedSite = methods.watch('siteId');

  const {
    mutate: createSiteRate,
    isPending: isCreatePending,
    isError: isCreateError,
    error: createError,
  } = api.site.createSiteRate.useMutation({
    onSuccess: () => {
      showToast('success', 'Valor de hora de sitio añadido correctamente');
      methods.reset();
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      showToast('error', error.message);
    },
  });

  const {
    mutate: editSiteRate,
    isPending: isEditPending,
    isError: isEditError,
    error: editError,
  } = api.site.editSiteRate.useMutation({
    onSuccess: () => {
      showToast('success', 'Valor de hora de sitio actualizado correctamente');
      methods.reset();
      setOpen(false);
      router.refresh();
    },
    onError: (error) => {
      showToast('error', error.message);
    },
  });

  const onSubmitHandler: SubmitHandler<SiteRate> = (values) => {
    isEdit ? editSiteRate({ id: rate.id, ...values }) : createSiteRate(values);
  };

  if (isCreateError || isEditError) {
    showToast('error', createError?.message ?? editError?.message);
  }

  return (
    <FormContainer
      formContext={methods}
      handleSubmit={handleSubmit(onSubmitHandler)}
      FormProps={{
        className: 'flex flex-col',
      }}
    >
      <Grid
        container
        size={{ xs: 12, md: 8 }}
        spacing={2}
        alignSelf="center"
        textAlign="center"
        marginX={{ xs: '1rem' }}
      >
        <Grid size={{ xs: 12 }}>
          <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
            {isEdit ? 'Editar' : 'Crear'} tarifa
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SelectElement
            name="siteId"
            label="Sitio"
            options={siteOptions}
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextFieldElement
            name="normalRate"
            label="Valor de hora normal (Lunes a Viernes)"
            type="number"
            required
            fullWidth
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextFieldElement
            name="saturdayPreRate"
            label="Valor de hora sábado hasta las 14:30"
            type="number"
            fullWidth
            disabled={
              !siteOptions.find((site) => site.id === selectedSite)
                ?.allowsExtraHours
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextFieldElement
            name="saturdayPostRate"
            label="Valor de hora sábado después de las 14:30"
            type="number"
            fullWidth
            disabled={
              !siteOptions.find((site) => site.id === selectedSite)
                ?.allowsExtraHours
            }
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <AutocompleteElement
            name="userId"
            label="Usuario"
            matchId
            options={userOptions}
            autocompleteProps={{
              getOptionLabel: (option) => option.label,
              noOptionsText: 'No se encontraron usuarios',
              clearOnEscape: true,
              autoHighlight: true,
              autoComplete: true,
              autoSelect: true,
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePickerElement
              name="retroactiveFrom"
              label="Hacer retroactivo desde"
              className="w-full"
              disableFuture={true}
              helperText="Elegir una fecha si se desea actualizar las horas cargadas de forma retroactiva"
              transform={{
                output: (value) => (value ? dayjs(value).toISOString() : null),
              }}
            />
          </LocalizationProvider>
        </Grid>
        {isEdit && (
          <Grid size={{ xs: 12 }}>
            <SwitchElement name="active" label="Activo" />
          </Grid>
        )}
        <Divider />
        <Grid size={{ xs: 12 }}>
          <LoadingButton
            loading={isCreatePending || isEditPending}
            disabled={!isValid || isCreatePending || isEditPending}
            variant="contained"
            color="success"
            type="submit"
            size="large"
          >
            {isEdit ? 'Editar' : 'Crear'}
          </LoadingButton>
        </Grid>
      </Grid>
    </FormContainer>
  );
}

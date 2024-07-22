'use client';

import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Divider, Stack, Typography } from '@mui/material';
import {
  useForm,
  type SubmitHandler,
  TextFieldElement,
  SelectElement,
  SwitchElement,
  AutocompleteElement,
} from 'react-hook-form-mui';

import { api } from '~/trpc/react';
import { type SiteRateFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { siteRateSchema, type SiteRate } from '~/schemas';
import FormContainer from '~/components/Form/FormContainer';

type Props = {
  rate?: SiteRateFull | null;
  siteOptions: { id: number; label: string }[];
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

  const {
    mutate: createSiteRate,
    isError,
    isPending,
    error,
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

  const onSubmitHandler: SubmitHandler<SiteRate> = (values) => {
    createSiteRate(values);
  };

  if (isError) {
    showToast('error', error.message);
  }

  return (
    <FormContainer
      formContext={methods}
      handleSubmit={handleSubmit(onSubmitHandler)}
    >
      <Typography variant="h1" gutterBottom>
        {isEdit ? 'Editar' : 'Crear'} tarifa
      </Typography>
      <Stack spacing={2} direction="column" gap={2}>
        <SelectElement
          name="siteId"
          label="Sitio"
          options={siteOptions}
          required
        />
        <TextFieldElement
          name="normalRate"
          label="Valor de hora normal (Lunes a Viernes)"
          type="number"
          required
        />
        <TextFieldElement
          name="saturdayPreRate"
          label="Valor de hora sábado hasta las 14:00"
          type="number"
        />
        <TextFieldElement
          name="saturdayPostRate"
          label="Valor de hora sábado después de las 14:00"
          type="number"
        />
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
        <SwitchElement name="active" label="Activo" />
        <Divider />
        <LoadingButton
          loading={isPending}
          disabled={isPending || !isValid}
          variant="contained"
          color="success"
          type="submit"
        >
          {isEdit ? 'Editar' : 'Crear'}
        </LoadingButton>
      </Stack>
    </FormContainer>
  );
}

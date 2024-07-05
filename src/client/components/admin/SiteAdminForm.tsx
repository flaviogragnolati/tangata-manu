'use client';

import { LoadingButton } from '@mui/lab';
import { Stack } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type SubmitHandler,
  TextareaAutosizeElement,
  TextFieldElement,
} from 'react-hook-form-mui';

import { api } from '~/trpc/react';
import { type SiteFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { siteSchema, type Site } from '~/schemas';
import FormContainer from '~/components/Form/FormContainer';

type Props = {
  site?: SiteFull | null;
};
export default function SiteAdminForm({ site }: Props) {
  const isEdit = !!site?.id;
  const defaultValues: Site = site ?? ({} as Site);
  const methods = useForm<Site>({
    mode: 'onBlur',
    resolver: zodResolver(siteSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const {
    mutate: createSite,
    isError,
    isPending,
    error,
  } = api.site.createSite.useMutation({
    onSuccess: () => {
      showToast('success', 'Sitio creado correctamente');
      methods.reset();
    },
    onError: (error) => {
      showToast('error', error.message);
    },
  });

  const onSubmitHandler: SubmitHandler<Site> = (values) => {
    createSite(values);
  };

  if (isError) {
    showToast('error', error.message);
  }

  return (
    <FormContainer
      formContext={methods}
      handleSubmit={handleSubmit(onSubmitHandler)}
      FormProps={{
        className: 'w-5/6',
      }}
    >
      <Stack spacing={2} direction="column" gap={2}>
        <TextFieldElement
          fullWidth
          name="name"
          label="Nombre del sitio"
          required
        />
        <TextFieldElement name="location" label="Ubicación" />
        <TextareaAutosizeElement
          name="description"
          label="Descripción del sitio"
        />
        <LoadingButton
          loading={isPending}
          disabled={isPending || !isValid}
          variant="contained"
          color="success"
          type="submit"
        >
          {isEdit ? 'Actualizar Sitio' : 'Crear Sitio'}
        </LoadingButton>
      </Stack>
    </FormContainer>
  );
}

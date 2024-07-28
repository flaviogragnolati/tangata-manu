'use client';

import { Grid } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type SubmitHandler,
  TextareaAutosizeElement,
  TextFieldElement,
  SwitchElement,
} from 'react-hook-form-mui';

import { api } from '~/trpc/react';
import { type SiteFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { siteSchema, type Site } from '~/schemas';
import FormContainer from '~/components/form/FormContainer';

type Props = {
  site?: SiteFull | null;
  setOpen: (value: boolean) => void;
};
export default function SiteAdminForm({ site, setOpen }: Props) {
  const router = useRouter();
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
  } = api.site.upsertSite.useMutation({
    onSuccess: () => {
      showToast('success', 'Sitio creado correctamente');
      methods.reset();
      setOpen(false);
      router.refresh();
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
        className: 'flex flex-col',
      }}
    >
      <Grid
        container
        spacing={2}
        xs={11}
        md={8}
        alignSelf="center"
        textAlign="center"
      >
        <Grid item xs={12}>
          <TextFieldElement
            fullWidth
            name="name"
            label="Nombre del sitio"
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextFieldElement name="location" label="Ubicación" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextareaAutosizeElement
            name="description"
            label="Descripción del sitio"
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <SwitchElement
            name="allowsExtraHours"
            label="Permite horas extra (sabado, domingo y feriados)"
          />
        </Grid>
        <Grid item xs={12}>
          <LoadingButton
            loading={isPending}
            disabled={isPending || !isValid}
            variant="contained"
            color="success"
            type="submit"
            size="large"
          >
            {isEdit ? 'Actualizar Sitio' : 'Crear Sitio'}
          </LoadingButton>
        </Grid>
      </Grid>
    </FormContainer>
  );
}

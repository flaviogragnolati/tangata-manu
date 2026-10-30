'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@mui/lab';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { SwitchElement, TextFieldElement } from 'react-hook-form-mui';
import {
  Alert,
  Button,
  DialogContent,
  FormHelperText,
  Stack,
  Typography,
} from '@mui/material';

import { api } from '~/trpc/react';
import type { SiteFull } from '~/types';
import { showToast } from '~/client-utils/toast';
import { siteSchema, type Site } from '~/schemas';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
  FormDialogForm,
} from '~/client/components/ui/FormDialog';

type Props = {
  site?: SiteFull | null;
  open: boolean;
  onClose: () => void;
};

const emptyToNull = (value: string | null | undefined) =>
  value?.trim() ? value.trim() : null;

export default function SiteAdminForm({ site, open, onClose }: Props) {
  const router = useRouter();
  const isEdit = !!site?.id;
  const [created, setCreated] = useState<{ id: number; name: string } | null>(
    null,
  );

  const methods = useForm<Site>({
    mode: 'onBlur',
    resolver: zodResolver(siteSchema),
    defaultValues: {
      id: site?.id ?? null,
      name: site?.name ?? '',
      location: site?.location ?? '',
      description: site?.description ?? '',
      allowsExtraHours: !!site?.allowsExtraHours,
    },
  });
  const { control, handleSubmit, formState } = methods;
  const allowsExtraHours = useWatch({ control, name: 'allowsExtraHours' });

  const upsert = api.site.upsertSite.useMutation({
    onSuccess: (saved) => {
      showToast('success', isEdit ? 'Sitio actualizado' : 'Sitio creado');
      router.refresh();
      if (isEdit) onClose();
      else setCreated({ id: saved.id, name: saved.name });
    },
    onError: (error) => showToast('error', error.message),
  });

  if (created) {
    return (
      <FormDialog open={open} title="Sitio creado" onClose={onClose}>
        <DialogContent dividers>
          <Typography>
            Sitio creado. Para que los usuarios puedan cargar horas en{' '}
            {created.name}, cargue la tarifa del sitio.
          </Typography>
        </DialogContent>
        <FormDialogActions>
          <Button onClick={onClose}>Más tarde</Button>
          <Button
            variant="contained"
            LinkComponent={Link}
            href={`/admin/site-rate?siteId=${created.id}&nueva=1`}
          >
            Cargar tarifa del sitio
          </Button>
        </FormDialogActions>
      </FormDialog>
    );
  }

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Editar sitio' : 'Nuevo sitio'}
      onClose={onClose}
      dirty={formState.isDirty}
    >
      <FormProvider {...methods}>
        <FormDialogForm
          onSubmit={handleSubmit((values) =>
            upsert.mutate({
              ...values,
              location: emptyToNull(values.location),
              description: emptyToNull(values.description),
            }),
          )}
        >
          <DialogContent dividers>
            <Stack spacing={3}>
              <Stack spacing={2}>
                <Typography variant="subtitle2">Datos del sitio</Typography>
                <TextFieldElement
                  control={control}
                  name="name"
                  label="Nombre"
                  required
                  fullWidth
                />
                <TextFieldElement
                  control={control}
                  name="location"
                  label="Ubicación"
                  fullWidth
                />
                <TextFieldElement
                  control={control}
                  name="description"
                  label="Descripción"
                  multiline
                  minRows={3}
                  fullWidth
                />
              </Stack>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Horas de sábado</Typography>
                <SwitchElement
                  control={control}
                  name="allowsExtraHours"
                  label="Permite horas de sábado"
                />
                <FormHelperText sx={{ mt: 0 }}>
                  Habilita las horas de sábado hasta y después de las 14:30 al
                  cargar horas y en las tarifas
                </FormHelperText>
                {isEdit && site?.allowsExtraHours && !allowsExtraHours && (
                  <Alert severity="warning">
                    Las tarifas y las horas de sábado ya cargadas no cambian.
                    Los usuarios ya no van a poder cargar horas de sábado en
                    este sitio.
                  </Alert>
                )}
              </Stack>
            </Stack>
          </DialogContent>
          <FormDialogActions>
            <FormDialogCancel />
            <LoadingButton
              type="submit"
              variant="contained"
              loading={upsert.isPending}
            >
              {isEdit ? 'Guardar' : 'Crear sitio'}
            </LoadingButton>
          </FormDialogActions>
        </FormDialogForm>
      </FormProvider>
    </FormDialog>
  );
}

'use client';
import { C } from '~/constants';
import { dayjs } from '~/utils/dayjs';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormContainer from './Form/FormContainer';
import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

import {
  useForm,
  useFieldArray,
  SelectElement,
  TextFieldElement,
} from 'react-hook-form-mui';

import { userHourLogFormSchema, type UserHourLogForm } from '~/schemas';
import type { SiteFull } from '~/types';

type Props = {
  sites: SiteFull[];
};
export default function HourLog({ sites }: Props) {
  const CURRENT_MONTH = dayjs().format('MMMM');

  const siteOptions = sites.map((site) => ({
    id: site.id,
    label: site.name,
  }));
  const rateOptions = C.rateTypes.map((rate) => ({
    id: rate,
    label: C.rateTypesMap[rate],
  }));

  const methods = useForm({
    mode: 'onBlur',
  });
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'hours',
  });

  const onSuccess = (values) => {
    console.log('SuBMIT', values);
  };
  return (
    <FormContainer<UserHourLogForm>
      formContext={methods}
      onSuccess={onSuccess}
      FormProps={{
        className: 'w-full flex flex-col gap-2',
      }}
      schema={userHourLogFormSchema}
    >
      <Typography variant="h6" className="text-center">
        Cargar horas de: {CURRENT_MONTH}
      </Typography>
      <Stack direction="column" gap={1}>
        {fields.map((field, idx) => {
          return (
            <Stack key={field.id} direction="row" gap={2}>
              <SelectElement
                name={`hours.${idx}.site`}
                label="Sitios"
                options={siteOptions}
                control={methods.control}
                required
                fullWidth
              />
              <SelectElement
                name={`hours.${idx}.rate`}
                label="Tarifa"
                options={rateOptions}
                control={methods.control}
                required
                fullWidth
              />
              <TextFieldElement
                name={`hours.${idx}.hours`}
                label="Cantidad"
                type="number"
                control={methods.control}
                required
                fullWidth
              />
              <IconButton onClick={() => remove(idx)} color="error">
                <DeleteIcon />
              </IconButton>
            </Stack>
          );
        })}
        <IconButton
          onClick={() => append({ site: '', rate: '', hours: '' })}
          color="primary"
        >
          <AddCircleIcon />
        </IconButton>
      </Stack>
      <LoadingButton
        //   loading={isPending}
        //   disabled={isPending}
        variant="contained"
        color="success"
        type="submit"
        className="mt-3 max-w-xs self-center"
      >
        Guardar
      </LoadingButton>
    </FormContainer>
  );
}

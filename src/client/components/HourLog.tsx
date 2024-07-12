'use client';
import { C } from '~/constants';
import { dayjs } from '~/utils/dayjs';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormContainer from './Form/FormContainer';
import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
// useForm,
// SelectElement,
// type SubmitHandler,
// useFieldArray,
// UseFormReturn,
import { TextFieldElement, SelectElement } from 'react-hook-form-mui';
// import TextFieldElement from './Fields/TextField';

import { userHourLogSchema, type UserHourLog } from '~/schemas';
import { useFieldArray, useForm, type UseFormReturn } from 'react-hook-form';
import type { SiteFull } from '~/types';

const getFormKeys = (months: [number, string][]) => {
  return months.map(([year, month]) => {
    return `${year}-${month}`;
  });
};

function getMonthsUpToDate() {
  const history = 4;
  const TODAY = dayjs();
  const dates: [number, string][] = [];

  for (let i = 0; i < history; i++) {
    const date = TODAY.subtract(i, 'month');
    const year = date.year();
    const month = dayjs(date).format('MMMM');
    dates.push([year, month]);
  }
  return dates;
}

type Props = {
  sites: SiteFull[];
};
export default function HourLog({ sites }: Props) {
  const months = getMonthsUpToDate();
  const formKeys = getFormKeys(months);
  console.log('months', months, formKeys);

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

  const onSuccess = (values) => {
    console.log('SuBMIT', values);
  };
  return (
    <FormContainer
      formContext={methods}
      onSuccess={onSuccess}
      FormProps={{
        className: 'w-full flex flex-col gap-2',
      }}
    >
      {formKeys.map((key, idx) => (
        <Stack key={`${key}-${idx}`} direction="column" gap={1}>
          <Typography variant="h5" className="self-center">
            {key}
          </Typography>
          <HourLogForm
            name={key}
            control={methods.control}
            options={{
              siteOptions,
              rateOptions,
            }}
          />
        </Stack>
      ))}
      <LoadingButton
        //   loading={isPending}
        //   disabled={isPending}
        variant="contained"
        color="success"
        type="submit"
        className="mt-3 max-w-xs self-center"
      >
        Cargar horas
      </LoadingButton>
    </FormContainer>
  );
}

interface HourLogFormProps {
  name: string;
  control: UseFormReturn['control'];
  options: {
    rateOptions: { id: string | number; label: string }[];
    siteOptions: { id: string | number; label: string }[];
  };
}
function HourLogForm({ name, control, options }: HourLogFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });
  return (
    <div>
      {fields.map((field, idx) => {
        return (
          <Stack key={field.id} direction="row" gap={2}>
            <SelectElement
              name={`${name}.${idx}.site`}
              label="Sitios"
              options={options.siteOptions}
              control={control}
              required
              fullWidth
            />
            <SelectElement
              name={`${name}.${idx}.rate`}
              label="Tarifa"
              options={options.rateOptions}
              control={control}
              required
              fullWidth
            />
            <TextFieldElement
              name={`${name}.${idx}.hours`}
              label="Cantidad"
              type="number"
              control={control}
              required
              fullWidth
            />
            <IconButton onClick={() => remove(idx)} color="error">
              <DeleteIcon />
            </IconButton>
          </Stack>
        );
      })}
      <IconButton onClick={() => append({})} color="info">
        <AddCircleIcon />
      </IconButton>
      <Divider />
    </div>
  );
}

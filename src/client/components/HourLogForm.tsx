'use client';
import { groupBy } from 'lodash';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import FormContainer from './Form/FormContainer';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import {
  useForm,
  useFieldArray,
  SelectElement,
  TextFieldElement,
} from 'react-hook-form-mui';

import { C } from '~/constants';
import { dayjs } from '~/utils/dayjs';
import BasicModal from '~/components/BasicModal';
import { type UserHourLogFormInput } from '~/schemas';
import HourLogConfirmation from './HourLogConfirmation';
import type { HourLogFull, SiteFull } from '~/types';
import PreviousHourLogDetail from './PreviousHourLogDetail';

type Props = {
  sites: SiteFull[];
  previousHourLogs: HourLogFull;
};
export default function HourLog({ sites, previousHourLogs }: Props) {
  const CURRENT_MONTH = dayjs().format('MMMM');
  const CURRENT_YEAR = dayjs().format('YYYY');

  const [open, setOpen] = useState(false);
  const [hoursBySite, setHoursBySite] = useState<
    Record<number, UserHourLogFormInput['hours']>
  >({});
  const siteOptions = sites.map((site) => ({
    id: site.id,
    label: site.name,
  }));
  const rateOptions = C.rateTypes.map((rate) => ({
    id: rate,
    label: C.rateTypesMap[rate],
  }));

  const methods = useForm<UserHourLogFormInput>({
    mode: 'onBlur',
    defaultValues: {
      hours: [{ site: undefined, rate: undefined, hours: undefined }],
    },
  });

  const {
    formState: { isValid },
  } = methods;
  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: 'hours',
  });

  return (
    <>
      <PreviousHourLogDetail hours={previousHourLogs} />
      <FormContainer<UserHourLogFormInput>
        formContext={methods}
        onSuccess={(values) => {
          const hoursBySite = groupBy(values.hours, 'site');
          setHoursBySite(hoursBySite);
          setOpen(true);
        }}
        FormProps={{
          className: 'w-full flex flex-col gap-2',
        }}
      >
        <Typography variant="h6" className="text-center">
          Cargar horas de: {CURRENT_MONTH} {CURRENT_YEAR}
        </Typography>
        <Stack direction="column" gap={1}>
          {fields.map((field, idx) => {
            return (
              <Stack key={field.id} direction="row" gap={2}>
                <Typography variant="h6">{idx + 1}</Typography>
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
            onClick={() =>
              append({ site: undefined!, rate: undefined!, hours: undefined! })
            }
            color="primary"
            className="self-center"
          >
            <AddCircleIcon />
            Agregar
          </IconButton>
        </Stack>
        <Divider />
        <LoadingButton
          disabled={!isValid}
          variant="contained"
          color="success"
          type="submit"
          className="mt-3 max-w-xs self-center"
        >
          Cargar horas
        </LoadingButton>
      </FormContainer>
      <BasicModal
        title="Confirmar horas"
        dialogProps={{
          open,
          onClose: () => setOpen(false),
          fullScreen: true,
        }}
      >
        <HourLogConfirmation
          sites={sites}
          setOpen={setOpen}
          useFormMethods={methods}
          hoursBySite={hoursBySite}
        />
      </BasicModal>
    </>
  );
}

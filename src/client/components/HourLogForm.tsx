'use client';
import { groupBy } from 'lodash';
import { useState } from 'react';
import { LoadingButton } from '@mui/lab';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import {
  Button,
  ButtonGroup,
  Divider,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import {
  useForm,
  useFieldArray,
  SelectElement,
  TextFieldElement,
  FormContainer,
} from 'react-hook-form-mui';

import { C } from '~/constants';
import { dayjs, getMonthName } from '~/utils/dayjs';
import BasicModal from '~/components/BasicModal';
import type { HourLogFull, SiteFull } from '~/types';
import { type UserHourLogFormInput } from '~/schemas';
import HourLogConfirmation from '~/components/HourLogConfirmation';
import PreviousHourLogDetail from '~/components/PreviousHourLogDetail';

type Props = {
  sites: SiteFull[];
  previousHourLogs: HourLogFull;
};
export default function HourLog({ sites, previousHourLogs }: Props) {
  const currentMonth = dayjs().month();
  const nextMonth = dayjs().add(1, 'month').month();
  const previousMonth = dayjs().subtract(1, 'month').month();
  const currentYear = dayjs().year();
  const nextYear = dayjs().add(1, 'year').year();
  const previousYear = dayjs().subtract(1, 'year').year();

  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
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

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Cargar horas
      </Typography>
      {(currentMonth === 11 || currentMonth === 0) && (
        <ButtonGroup
          size="large"
          className="my-2 flex justify-center"
          color="secondary"
        >
          {currentMonth === 0 && (
            <Button
              onClick={() => handleYearSelect(previousYear)}
              variant={selectedYear === previousYear ? 'contained' : 'outlined'}
            >
              {previousYear}
            </Button>
          )}
          <Button
            onClick={() => handleYearSelect(currentYear)}
            variant={selectedYear === currentYear ? 'contained' : 'outlined'}
          >
            {currentYear}
          </Button>
          {currentMonth === 11 && (
            <Button
              onClick={() => handleYearSelect(nextYear)}
              variant={selectedYear === nextYear ? 'contained' : 'outlined'}
            >
              {nextYear}
            </Button>
          )}
        </ButtonGroup>
      )}
      <ButtonGroup size="large" className="my-2 flex justify-center">
        <Button
          onClick={() => handleMonthSelect(previousMonth)}
          variant={selectedMonth === previousMonth ? 'contained' : 'outlined'}
        >
          {getMonthName(previousMonth)}
        </Button>
        <Button
          onClick={() => handleMonthSelect(currentMonth)}
          variant={selectedMonth === currentMonth ? 'contained' : 'outlined'}
        >
          {getMonthName(currentMonth)}
        </Button>
        <Button
          onClick={() => handleMonthSelect(nextMonth)}
          variant={selectedMonth === nextMonth ? 'contained' : 'outlined'}
        >
          {getMonthName(nextMonth)}
        </Button>
      </ButtonGroup>
      <PreviousHourLogDetail
        hours={previousHourLogs}
        month={selectedMonth}
        year={selectedYear}
      />
      <FormContainer<UserHourLogFormInput>
        formContext={methods}
        onSuccess={(values) => {
          const hoursBySite = groupBy(values.hours, 'site');
          setHoursBySite(hoursBySite);
          setOpen(true);
        }}
        FormProps={{
          className: 'flex flex-col',
        }}
      >
        <Divider className="mb-2 py-2">
          <Typography variant="h5" className="text-center">
            Cargar horas para: {getMonthName(selectedMonth)} {selectedYear}
          </Typography>
        </Divider>
        <Grid
          container
          xs={12}
          md={10}
          gap={2}
          alignItems="center"
          alignSelf="center"
          textAlign="center"
          direction="column"
        >
          {fields.map((field, idx) => {
            return (
              <Grid
                item
                container
                key={field.id}
                xs={12}
                spacing={1}
                alignItems="center"
                alignSelf="center"
                textAlign="center"
                direction="row"
              >
                <Grid item>
                  <Typography variant="h6">{idx + 1}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <SelectElement
                    name={`hours.${idx}.site`}
                    label="Sitio"
                    options={siteOptions}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <SelectElement
                    name={`hours.${idx}.rate`}
                    label="Tarifa"
                    options={rateOptions}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextFieldElement
                    name={`hours.${idx}.hours`}
                    label="Cantidad"
                    type="number"
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item>
                  <IconButton onClick={() => remove(idx)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}
          <Grid item xs={12}>
            <IconButton
              onClick={() =>
                append({
                  site: undefined!,
                  rate: undefined!,
                  hours: undefined!,
                })
              }
              color="primary"
              className="self-center"
            >
              <AddCircleIcon />
              Agregar
            </IconButton>
          </Grid>
        </Grid>
        <Divider />
        <LoadingButton
          disabled={!isValid}
          variant="contained"
          color="success"
          type="submit"
          className="mt-3 max-w-xs self-center"
          size="large"
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
          month={selectedMonth}
          year={selectedYear}
        />
      </BasicModal>
    </>
  );
}

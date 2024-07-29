'use client';
import { groupBy, keys } from 'lodash';
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
import BasicModal from '~/components/ui/BasicModal';
import { dayjs, getMonthName } from '~/utils/dayjs';
import type { HourLogFull, SiteFull } from '~/types';
import { type UserHourLogFormInput } from '~/schemas';
import HourLogConfirmation from '~/components/user/HourLogConfirmation';
import PreviousHourLogDetail from '~/components/user/PreviousHourLogDetail';

type Props = {
  sites: SiteFull[];
  previousHourLogs: HourLogFull;
};
export default function HourLogForm({ sites, previousHourLogs }: Props) {
  const now = dayjs();
  const currentMonth = now.month();
  const previousMonth = now.subtract(1, 'month').month();
  const currentYear = now.year();
  const previousYear = now.subtract(1, 'year').year();
  const isWithin5Days = now.date() <= 5;
  const isJanuary = currentMonth === 0;
  let dateOptions: Record<number, number[]> | null = null;

  if (isJanuary) {
    if (isWithin5Days) {
      dateOptions = {
        [previousYear]: [previousMonth],
        [currentYear]: [currentMonth],
      };
    } else {
      dateOptions = {
        [currentYear]: [currentMonth],
      };
    }
  } else {
    if (isWithin5Days) {
      dateOptions = {
        [currentYear]: [previousMonth, currentMonth],
      };
    } else {
      dateOptions = {
        [currentYear]: [currentMonth],
      };
    }
  }

  const siteOptions = sites.map((site) => ({
    id: site.id,
    label: site.name,
  }));
  const rateOptions = C.rateTypes.map((rate) => ({
    id: rate,
    label: C.rateTypesMap[rate],
  }));

  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [hoursBySite, setHoursBySite] = useState<
    Record<number, UserHourLogFormInput['hours']>
  >({});

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
    if (isJanuary) {
      if (year === previousYear) {
        setSelectedMonth(previousMonth);
      } else {
        setSelectedMonth(currentMonth);
      }
    }
    setSelectedYear(year);
  };

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Cargar horas
      </Typography>
      {keys(dateOptions)?.length > 1 && (
        <ButtonGroup
          size="large"
          className="my-2 flex justify-center"
          color="secondary"
        >
          {keys(dateOptions).map((_year) => {
            const year = parseInt(_year);
            return (
              <Button
                key={year}
                onClick={() => handleYearSelect(year)}
                variant={selectedYear === year ? 'contained' : 'outlined'}
              >
                {year}
              </Button>
            );
          })}
        </ButtonGroup>
      )}
      {dateOptions[selectedYear]?.length && (
        <ButtonGroup size="large" className="my-2 flex justify-center">
          {dateOptions[selectedYear].map((month) => (
            <Button
              key={month}
              onClick={() => handleMonthSelect(month)}
              variant={selectedMonth === month ? 'contained' : 'outlined'}
            >
              {getMonthName(month)}
            </Button>
          ))}
        </ButtonGroup>
      )}

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
          disabled={!isValid || fields.length === 0}
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

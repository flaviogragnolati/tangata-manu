'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
} from 'react-hook-form';
import { SelectElement } from 'react-hook-form-mui';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';

import { C } from '~/constants';
import type { HourLogFull, SiteFull } from '~/types';
import {
  formatPeriod,
  isSamePeriod,
  loadablePeriods,
  type Period,
} from '~/client/lib/period';
import {
  userHourLogFormInputSchema,
  type RateType,
  type UserHourLogFormInput,
} from '~/schemas';
import PageHeader from '~/client/components/ui/PageHeader';
import HoursField from '~/client/components/form/HoursField';
import HourLogConfirmation from '~/components/user/HourLogConfirmation';
import PreviousHourLogDetail from '~/components/user/PreviousHourLogDetail';

type Props = {
  sites: SiteFull[];
  previousHourLogs: HourLogFull;
};

type Entry = UserHourLogFormInput['hours'][number];
const emptyEntry = () =>
  ({ site: undefined, rate: undefined, hours: undefined }) as unknown as Entry;

const rateOptions = (allowsExtraHours: boolean) =>
  C.rateTypes
    .filter((rate) => allowsExtraHours || rate === 'normal')
    .map((rate) => ({ id: rate, label: C.rateTypesMap[rate] }));

export default function HourLogForm({ sites, previousHourLogs }: Props) {
  const [periods] = useState(() => loadablePeriods());
  const [period, setPeriod] = useState<Period>(periods[periods.length - 1]!);
  const [confirming, setConfirming] = useState<Entry[] | null>(null);

  const methods = useForm<UserHourLogFormInput>({
    mode: 'onBlur',
    resolver: zodResolver(userHourLogFormInputSchema),
    defaultValues: { hours: [emptyEntry()] },
  });
  const { control, handleSubmit, setValue, getValues } = methods;
  const { fields, append, remove } = useFieldArray({ control, name: 'hours' });

  const siteOptions = sites.map((site) => ({ id: site.id, label: site.name }));
  const allowsExtraHours = (siteId: unknown) =>
    !!sites.find((site) => site.id === siteId)?.allowsExtraHours;

  return (
    <>
      <PageHeader
        title="Cargar horas"
        subtitle="Elija el mes y agregue las horas de cada sitio"
      />

      <Box sx={{ mb: 3 }}>
        {periods.length > 1 ? (
          <ToggleButtonGroup
            exclusive
            color="primary"
            value={periods.findIndex((p) => isSamePeriod(p, period))}
            onChange={(_, index: number | null) => {
              const next = index === null ? undefined : periods[index];
              if (next) setPeriod(next);
            }}
            aria-label="Mes"
          >
            {periods.map((p, index) => (
              <ToggleButton key={`${p.year}-${p.month}`} value={index}>
                {formatPeriod(p, C.months)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        ) : (
          <Chip color="primary" label={formatPeriod(period, C.months)} />
        )}
      </Box>

      <PreviousHourLogDetail
        hours={previousHourLogs}
        period={period}
        sites={sites}
      />

      <FormProvider {...methods}>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit((values) => setConfirming(values.hours))}
        >
          <Stack spacing={2}>
            {fields.map((field, idx) => (
              <Card key={field.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Fila {idx + 1}</Typography>
                    <Tooltip title="Borrar fila">
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Borrar fila ${idx + 1}`}
                          disabled={fields.length === 1}
                          onClick={() => remove(idx)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <SelectElement
                      control={control}
                      name={`hours.${idx}.site`}
                      label="Sitio"
                      options={siteOptions}
                      required
                      fullWidth
                      onChange={(siteId) => {
                        const rate = getValues(`hours.${idx}.rate`);
                        if (
                          rate &&
                          rate !== 'normal' &&
                          !allowsExtraHours(siteId)
                        ) {
                          setValue(
                            `hours.${idx}.rate`,
                            undefined as unknown as RateType,
                          );
                        }
                      }}
                    />
                    <RateSelect
                      control={control}
                      idx={idx}
                      allowsExtraHours={allowsExtraHours}
                    />
                    <HoursField<UserHourLogFormInput>
                      control={control}
                      name={`hours.${idx}.hours`}
                      label="Horas"
                      required
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() => append(emptyEntry())}
              sx={{ alignSelf: 'flex-start' }}
            >
              Agregar otra fila
            </Button>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              position: 'sticky',
              bottom: 0,
              mt: 3,
              px: 2,
              py: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              zIndex: 1,
            }}
          >
            <TotalHours control={control} />
            <Button type="submit" variant="contained">
              Revisar y confirmar
            </Button>
          </Paper>
        </Box>
      </FormProvider>

      {confirming && (
        <HourLogConfirmation
          open
          period={period}
          entries={confirming}
          onClose={() => setConfirming(null)}
          onConfirmed={() => {
            setConfirming(null);
            methods.reset();
          }}
        />
      )}
    </>
  );
}

function RateSelect({
  control,
  idx,
  allowsExtraHours,
}: {
  control: Control<UserHourLogFormInput>;
  idx: number;
  allowsExtraHours: (siteId: unknown) => boolean;
}) {
  const siteId = useWatch({ control, name: `hours.${idx}.site` });
  return (
    <SelectElement
      control={control}
      name={`hours.${idx}.rate`}
      label="Tipo de hora"
      options={rateOptions(allowsExtraHours(siteId))}
      required
      fullWidth
    />
  );
}

function TotalHours({ control }: { control: Control<UserHourLogFormInput> }) {
  const entries = useWatch({ control, name: 'hours' });
  const total = entries.reduce(
    (acc, entry) => acc + (Number(entry?.hours) || 0),
    0,
  );
  const sitesCount = new Set(
    entries
      .map((entry) => entry?.site)
      .filter((site) => site !== undefined && site !== null),
  ).size;
  return (
    <Typography sx={{ flex: 1 }}>
      Total: <strong>{total} h</strong> en {sitesCount}{' '}
      {sitesCount === 1 ? 'sitio' : 'sitios'}
    </Typography>
  );
}

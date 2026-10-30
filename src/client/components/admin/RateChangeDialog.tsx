'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { skipToken } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { AutocompleteElement, SelectElement } from 'react-hook-form-mui';
import { LoadingButton } from '@mui/lab';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  DialogContent,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { z } from 'zod';

import { api } from '~/trpc/react';
import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import { showToast } from '~/client-utils/toast';
import { currentPeriod, type Period } from '~/client/lib/period';
import type { RateChangeInput, RateValues } from '~/schemas';
import type { SiteRateFull } from '~/types';
import FormDialog, {
  FormDialogActions,
  FormDialogCancel,
  FormDialogForm,
} from '~/client/components/ui/FormDialog';
import MoneyField from '~/client/components/form/MoneyField';
import MonthStepper from '~/client/components/filters/MonthStepper';
import RateChangeImpact from '~/components/admin/RateChangeImpact';

export type RateDialogMode =
  | { kind: 'change'; rate: SiteRateFull }
  | { kind: 'correct'; rate: SiteRateFull }
  | { kind: 'new'; siteId?: number; userId?: string }
  | { kind: 'removeUserRate'; rate: SiteRateFull };

type ApplyTo = 'forward' | 'fromPeriod' | 'correction';

type Props = {
  mode: RateDialogMode | null;
  onClose: () => void;
  rates: SiteRateFull[];
  sites: { id: number; label: string; allowsExtraHours: boolean }[];
  users: { id: string; label: string }[];
};

const TITLES: Record<RateDialogMode['kind'], string> = {
  change: 'Cambiar tarifa',
  correct: 'Corregir tarifa',
  new: 'Nueva tarifa',
  removeUserRate: 'Quitar tarifa por usuario',
};

const rateField = z
  .number({ invalid_type_error: 'Ingrese un monto válido' })
  .min(0, 'Ingrese un monto mayor o igual a 0')
  .nullable();

const formSchema = (kind: RateDialogMode['kind']) =>
  z
    .object({
      siteId: z.number().nullable(),
      scope: z.enum(['site', 'user']).nullable(),
      userId: z.string().nullable(),
      normalRate: rateField,
      saturdayPreRate: rateField,
      saturdayPostRate: rateField,
      applyTo: z.enum(['forward', 'fromPeriod', 'correction']).nullable(),
    })
    .superRefine((values, ctx) => {
      const issue = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message });
      if (kind === 'new') {
        if (values.siteId === null) issue('siteId', 'Elija un sitio');
        if (values.scope === null) issue('scope', 'Elija para quién es');
        if (values.scope === 'user' && !values.userId) {
          issue('userId', 'Elija un usuario');
        }
      }
      if (kind !== 'removeUserRate' && values.normalRate === null) {
        issue('normalRate', 'Ingrese el valor de la hora normal');
      }
      if (kind !== 'correct' && values.applyTo === null) {
        issue('applyTo', 'Elija a qué horas se aplica');
      }
    });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

const rateValues = (rate: {
  normalRate: number | null;
  saturdayPreRate: number | null;
  saturdayPostRate: number | null;
}): RateValues => ({
  normalRate: rate.normalRate ?? 0,
  saturdayPreRate: rate.saturdayPreRate ?? 0,
  saturdayPostRate: rate.saturdayPostRate ?? 0,
});

const sameValues = (a: RateValues, b: RateValues) =>
  a.normalRate === b.normalRate &&
  a.saturdayPreRate === b.saturdayPreRate &&
  a.saturdayPostRate === b.saturdayPostRate;

const userLabel = (rate: SiteRateFull) =>
  rate.User?.name ?? rate.User?.email ?? 'Usuario';

function newestActive(
  rates: SiteRateFull[],
  siteId: number,
  userId: string | null,
) {
  return (
    rates
      .filter(
        (rate) =>
          rate.active &&
          rate.siteId === siteId &&
          (rate.userId ?? null) === userId,
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0] ?? null
  );
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Guided dialog for every Tarifa operation: data and scope, then Impacto. */
export default function RateChangeDialog({ mode, ...props }: Props) {
  if (!mode) return null;
  return <RateChangeSteps mode={mode} {...props} />;
}

function RateChangeSteps({
  mode,
  onClose,
  rates,
  sites,
  users,
}: Props & { mode: RateDialogMode }) {
  const router = useRouter();
  const kind = mode.kind;
  const rate = kind === 'new' ? null : mode.rate;
  const [step, setStep] = useState<1 | 2>(1);
  const [period, setPeriod] = useState<Period>(() => currentPeriod());
  const [confirmed, setConfirmed] = useState<RateChangeInput | null>(null);

  const methods = useForm<FormValues>({
    mode: 'all',
    resolver: zodResolver(formSchema(kind)),
    defaultValues: {
      siteId: rate?.siteId ?? (kind === 'new' ? (mode.siteId ?? null) : null),
      scope: kind === 'new' ? (mode.userId ? 'user' : null) : null,
      userId: rate?.userId ?? (kind === 'new' ? (mode.userId ?? null) : null),
      normalRate: rate?.normalRate ?? null,
      saturdayPreRate: rate?.saturdayPreRate ?? null,
      saturdayPostRate: rate?.saturdayPostRate ?? null,
      applyTo: null,
    },
  });
  const { control, formState } = methods;
  const values = useWatch({ control });

  const siteId = values.siteId ?? null;
  const site = sites.find((s) => s.id === siteId) ?? null;
  const scopeUserId =
    rate?.userId ?? (values.scope === 'user' ? (values.userId ?? null) : null);
  const vigente =
    kind === 'new' && siteId !== null && values.scope
      ? newestActive(rates, siteId, scopeUserId)
      : null;
  const siteRate =
    kind === 'removeUserRate' && rate
      ? newestActive(rates, rate.siteId, null)
      : null;

  const newValues: RateValues | null = useMemo(() => {
    if (kind === 'removeUserRate' || typeof values.normalRate !== 'number') {
      return null;
    }
    // Hidden Saturday fields keep the rate's current values (0 for a new one)
    const saturday = site?.allowsExtraHours
      ? {
          saturdayPreRate: values.saturdayPreRate ?? 0,
          saturdayPostRate: values.saturdayPostRate ?? 0,
        }
      : {
          saturdayPreRate: rate?.saturdayPreRate ?? 0,
          saturdayPostRate: rate?.saturdayPostRate ?? 0,
        };
    return { normalRate: values.normalRate, ...saturday };
  }, [
    kind,
    values.normalRate,
    values.saturdayPreRate,
    values.saturdayPostRate,
    site,
    rate,
  ]);

  const unchanged =
    !!rate &&
    !!newValues &&
    kind !== 'removeUserRate' &&
    sameValues(newValues, rateValues(rate));

  const input: RateChangeInput | null = useMemo(() => {
    if (!formState.isValid) return null;
    const retroactiveFrom = values.applyTo === 'fromPeriod' ? period : null;
    if (kind === 'removeUserRate') {
      return rate && siteRate
        ? { kind, siteRateId: rate.id, retroactiveFrom }
        : null;
    }
    if (!newValues || unchanged) return null;
    if (kind === 'correct' || values.applyTo === 'correction') {
      return rate
        ? { kind: 'correct', siteRateId: rate.id, values: newValues }
        : null;
    }
    if (siteId === null) return null;
    return {
      kind: 'replace',
      siteId,
      userId: scopeUserId,
      values: newValues,
      retroactiveFrom,
    };
  }, [
    formState.isValid,
    values.applyTo,
    period,
    kind,
    rate,
    siteRate,
    newValues,
    unchanged,
    siteId,
    scopeUserId,
  ]);

  // Live count for "También a las cargadas desde", without a request per keystroke
  const liveInput = useDebounced(
    values.applyTo === 'fromPeriod' ? input : null,
  );
  const live = api.site.previewRateChange.useQuery(
    step === 1 && liveInput ? liveInput : skipToken,
    { retry: false },
  );
  const preview = api.site.previewRateChange.useQuery(
    step === 2 && confirmed ? confirmed : skipToken,
    { retry: false },
  );

  const apply = api.site.applyRateChange.useMutation({
    onSuccess: (result) => {
      const recalculated =
        result.recalculated > 0
          ? ` · se recalcularon ${result.recalculated} registros`
          : '';
      const done =
        confirmed?.kind === 'correct'
          ? 'Tarifa corregida'
          : confirmed?.kind === 'removeUserRate'
            ? 'Tarifa por usuario quitada'
            : preview.data?.replacedRate
              ? 'Tarifa reemplazada'
              : 'Tarifa creada';
      showToast('success', `${done}${recalculated}`);
      router.refresh();
      onClose();
    },
    onError: (error) => {
      if (error.data?.code === 'CONFLICT') {
        showToast('warning', error.message);
        void preview.refetch();
        return;
      }
      showToast('error', error.message);
    },
  });

  const subtitle = rate
    ? `${rate.Site.name} · ${rate.userId ? userLabel(rate) : 'Tarifa del sitio'}`
    : undefined;

  const confirmLabel = !confirmed
    ? ''
    : confirmed.kind === 'correct'
      ? `Corregir y recalcular ${preview.data?.totals.logs ?? ''} registros`
      : confirmed.kind === 'removeUserRate'
        ? 'Quitar tarifa por usuario'
        : preview.data?.replacedRate
          ? 'Reemplazar tarifa'
          : 'Crear tarifa';

  const recalculatedCount = rate?._count.UserHourLog ?? 0;

  return (
    <FormDialog
      open
      title={TITLES[kind]}
      subtitle={subtitle}
      onClose={onClose}
      dirty={formState.isDirty || step === 2}
      maxWidth="md"
    >
      <FormProvider {...methods}>
        <FormDialogForm
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 1 && input) {
              setConfirmed(input);
              setStep(2);
            } else if (step === 2 && confirmed && preview.data) {
              apply.mutate({
                change: confirmed,
                expectedFingerprint: preview.data.fingerprint,
              });
            }
          }}
        >
          {step === 1 ? (
            <DialogContent dividers>
              <Stack spacing={3}>
                {kind === 'new' && (
                  <Stack spacing={2}>
                    <SelectElement
                      control={control}
                      name="siteId"
                      label="Sitio"
                      options={sites}
                      required
                      fullWidth
                    />
                    <Controller
                      control={control}
                      name="scope"
                      render={({ field, fieldState }) => (
                        <FormControl error={!!fieldState.error}>
                          <FormLabel>¿Para quién es?</FormLabel>
                          <RadioGroup
                            value={field.value ?? ''}
                            onChange={(_, next) => field.onChange(next)}
                          >
                            <FormControlLabel
                              value="site"
                              control={<Radio />}
                              label="Todos los usuarios del sitio"
                            />
                            <FormControlLabel
                              value="user"
                              control={<Radio />}
                              label="Un usuario"
                            />
                          </RadioGroup>
                        </FormControl>
                      )}
                    />
                    {values.scope === 'user' && (
                      <AutocompleteElement
                        control={control}
                        name="userId"
                        label="Usuario"
                        matchId
                        required
                        options={users}
                        autocompleteProps={{
                          noOptionsText: 'No se encontraron usuarios',
                          autoHighlight: true,
                        }}
                      />
                    )}
                    {vigente && (
                      <Alert severity="info">
                        Reemplaza a la tarifa vigente:{' '}
                        {ARSformatter.format(vigente.normalRate ?? 0)}/h desde{' '}
                        {formatDate(vigente.createdAt)}
                      </Alert>
                    )}
                  </Stack>
                )}

                {kind === 'removeUserRate' && rate ? (
                  siteRate ? (
                    <Typography>
                      {userLabel(rate)} va a cobrar la tarifa del sitio (
                      {ARSformatter.format(siteRate.normalRate ?? 0)}/h).
                    </Typography>
                  ) : (
                    <Alert severity="error">
                      El sitio no tiene tarifa del sitio vigente. Cárguela antes
                      de quitar la tarifa por usuario.
                    </Alert>
                  )
                ) : (
                  <Stack spacing={2}>
                    <MoneyField<FormValues>
                      name="normalRate"
                      label="Hora normal (L a V)"
                      required
                      previousValue={rate ? (rate.normalRate ?? 0) : undefined}
                    />
                    {site?.allowsExtraHours && (
                      <>
                        <MoneyField<FormValues>
                          name="saturdayPreRate"
                          label="Sábado hasta las 14:30"
                          previousValue={
                            rate ? (rate.saturdayPreRate ?? 0) : undefined
                          }
                        />
                        <MoneyField<FormValues>
                          name="saturdayPostRate"
                          label="Sábado después de las 14:30"
                          previousValue={
                            rate ? (rate.saturdayPostRate ?? 0) : undefined
                          }
                        />
                      </>
                    )}
                    {unchanged && (
                      <FormHelperText>
                        Los valores son iguales a los actuales
                      </FormHelperText>
                    )}
                  </Stack>
                )}

                {kind === 'correct' ? (
                  <Alert severity="info">
                    Se recalculan los {recalculatedCount} registros que usan
                    esta tarifa
                  </Alert>
                ) : (
                  <Controller
                    control={control}
                    name="applyTo"
                    render={({ field }) => (
                      <FormControl>
                        <FormLabel>
                          ¿A qué horas se aplica el valor nuevo?
                        </FormLabel>
                        <RadioGroup
                          value={field.value ?? ''}
                          onChange={(_, next) =>
                            field.onChange(next as ApplyTo)
                          }
                        >
                          <FormControlLabel
                            value="forward"
                            control={<Radio />}
                            label="Solo a las horas que se carguen desde ahora"
                          />
                          <FormControlLabel
                            value="fromPeriod"
                            control={<Radio />}
                            label="También a las cargadas desde"
                          />
                          {field.value === 'fromPeriod' && (
                            <Box sx={{ pl: 4, pb: 1 }}>
                              <MonthStepper
                                value={period}
                                onChange={setPeriod}
                                max={currentPeriod()}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                {liveCount(live)}
                              </Typography>
                            </Box>
                          )}
                          {kind === 'change' && (
                            <>
                              <FormControlLabel
                                value="correction"
                                control={<Radio />}
                                label="Es una corrección: aplicar a todas las horas de esta tarifa"
                              />
                              <FormHelperText sx={{ ml: 4, mt: -0.5 }}>
                                Se recalculan los {recalculatedCount} registros
                                que usan esta tarifa
                              </FormHelperText>
                            </>
                          )}
                        </RadioGroup>
                      </FormControl>
                    )}
                  />
                )}
              </Stack>
            </DialogContent>
          ) : (
            <DialogContent dividers>
              {preview.isPending ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress aria-label="Calculando el impacto" />
                </Box>
              ) : preview.isError ? (
                <Alert severity="error">{preview.error.message}</Alert>
              ) : (
                confirmed && (
                  <Stack spacing={2}>
                    {confirmed.kind !== 'removeUserRate' && (
                      <Typography variant="body2" color="text.secondary">
                        {preview.data.siteName} · Valor nuevo:{' '}
                        {ARSformatter.format(
                          preview.data.targetValues.normalRate,
                        )}
                        /h
                        {site?.allowsExtraHours &&
                          ` · Sábado ${ARSformatter.format(preview.data.targetValues.saturdayPreRate)} / ${ARSformatter.format(preview.data.targetValues.saturdayPostRate)}`}
                      </Typography>
                    )}
                    <RateChangeImpact
                      preview={preview.data}
                      kind={confirmed.kind}
                    />
                  </Stack>
                )
              )}
            </DialogContent>
          )}

          <FormDialogActions>
            {step === 1 ? (
              <>
                <FormDialogCancel />
                <Button type="submit" variant="contained" disabled={!input}>
                  Ver impacto
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setStep(1)} disabled={apply.isPending}>
                  Volver
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={apply.isPending}
                  disabled={!preview.data || preview.isFetching}
                >
                  {confirmLabel}
                </LoadingButton>
              </>
            )}
          </FormDialogActions>
        </FormDialogForm>
      </FormProvider>
    </FormDialog>
  );
}

function liveCount(live: {
  data?: { totals: { logs: number; users: number } };
  isFetching: boolean;
  error: { message: string } | null;
}) {
  if (live.error) return live.error.message;
  if (!live.data) return live.isFetching ? 'Calculando…' : '';
  const { logs, users } = live.data.totals;
  return `Se recalculan ${logs} ${logs === 1 ? 'registro' : 'registros'} de ${users} ${users === 1 ? 'usuario' : 'usuarios'}`;
}

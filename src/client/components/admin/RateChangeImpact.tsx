'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import C from '~/constants';
import { ARSformatter } from '~/utils/helpers';
import { formatPeriod, isSamePeriod } from '~/client/lib/period';
import type { RateChangeInput } from '~/schemas';
import type { RateChangePreview } from '~/types';

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

const signed = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${ARSformatter.format(Math.abs(value))}`;

type Props = {
  preview: RateChangePreview;
  kind: RateChangeInput['kind'];
};

export default function RateChangeImpact({ preview, kind }: Props) {
  const { items, totals } = preview;

  return (
    <Stack spacing={2}>
      {items.length > 0 ? (
        <>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {plural(totals.logs, 'registro', 'registros')} ·{' '}
                {plural(totals.users, 'usuario', 'usuarios')}
                {totals.from &&
                  totals.to &&
                  ` · ${periodRange(totals.from, totals.to)}`}
              </Typography>
              <Typography variant="h6" component="p" sx={{ mt: 0.5 }}>
                Total {ARSformatter.format(totals.fromAmount)} →{' '}
                {ARSformatter.format(totals.toAmount)}{' '}
                <Typography component="span" color="text.secondary">
                  ({signed(totals.toAmount - totals.fromAmount)})
                </Typography>
              </Typography>
            </CardContent>
          </Card>
          {totals.touchesPastPeriods && (
            <Alert severity="warning">
              Cambia montos de meses anteriores al actual
            </Alert>
          )}
          <Accordion disableGutters variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              Ver detalle
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Período</TableCell>
                      <TableCell align="right">Horas</TableCell>
                      <TableCell align="right">Actual</TableCell>
                      <TableCell align="right">Nuevo</TableCell>
                      <TableCell align="right">Δ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.hourLogId}>
                        <TableCell>{item.userName ?? item.userEmail}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatPeriod(item.period, C.months)}
                        </TableCell>
                        <TableCell align="right">{item.hours}</TableCell>
                        <TableCell align="right">
                          {ARSformatter.format(item.fromAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {ARSformatter.format(item.toAmount)}
                        </TableCell>
                        <TableCell align="right">
                          {signed(item.toAmount - item.fromAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </>
      ) : (
        <Alert severity="info">
          No cambia ninguna hora cargada.
          {preview.keptOnPreviousRate > 0 &&
            ` ${plural(preview.keptOnPreviousRate, 'registro queda', 'registros quedan')} con la tarifa anterior y en Horas se van a ver como "Tarifa desactualizada".`}
        </Alert>
      )}
      {kind === 'replace' && (
        <Typography variant="body2" color="text.secondary">
          Si un usuario agrega horas a un mes que ya tiene cargado, ese registro
          pasa entero a la tarifa nueva.
        </Typography>
      )}
    </Stack>
  );
}

function periodRange(
  from: { year: number; month: number },
  to: { year: number; month: number },
) {
  return isSamePeriod(from, to)
    ? formatPeriod(from, C.months)
    : `${formatPeriod(from, C.months)} a ${formatPeriod(to, C.months)}`;
}

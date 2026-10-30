'use client';

import { useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material';

import C from '~/constants';
import {
  comparePeriods,
  currentPeriod,
  formatPeriod,
  isSamePeriod,
  nextPeriod,
  previousPeriod,
  type Period,
} from '~/client/lib/period';

const DEFAULT_MIN: Period = { year: 2024, month: 0 };

type Props = {
  value: Period;
  onChange: (period: Period) => void;
  min?: Period;
  max?: Period;
};

export default function MonthStepper({
  value,
  onChange,
  min = DEFAULT_MIN,
  max,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pickerYear, setPickerYear] = useState(value.year);

  const isOutOfRange = (p: Period) =>
    comparePeriods(p, min) < 0 || (!!max && comparePeriods(p, max) > 0);
  const prev = previousPeriod(value);
  const next = nextPeriod(value);
  const today = currentPeriod();

  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <IconButton
        aria-label="Mes anterior"
        size="small"
        disabled={isOutOfRange(prev)}
        onClick={() => onChange(prev)}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Button
        color="inherit"
        onClick={(event) => {
          setPickerYear(value.year);
          setAnchor(event.currentTarget);
        }}
        sx={{ minWidth: 140, fontWeight: 600 }}
        aria-haspopup="dialog"
      >
        {formatPeriod(value, C.months)}
      </Button>
      <IconButton
        aria-label="Mes siguiente"
        size="small"
        disabled={isOutOfRange(next)}
        onClick={() => onChange(next)}
      >
        <ChevronRightIcon />
      </IconButton>
      <Button
        size="small"
        variant="outlined"
        disabled={isSamePeriod(value, today) || isOutOfRange(today)}
        onClick={() => onChange(today)}
      >
        Hoy
      </Button>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <IconButton
              aria-label="Año anterior"
              size="small"
              disabled={pickerYear <= min.year}
              onClick={() => setPickerYear((y) => y - 1)}
            >
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {pickerYear}
            </Typography>
            <IconButton
              aria-label="Año siguiente"
              size="small"
              disabled={!!max && pickerYear >= max.year}
              onClick={() => setPickerYear((y) => y + 1)}
            >
              <ChevronRightIcon />
            </IconButton>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
            }}
          >
            {C.months.map((name, month) => {
              const period = { year: pickerYear, month };
              const selected = isSamePeriod(period, value);
              return (
                <Button
                  key={name}
                  size="small"
                  variant={selected ? 'contained' : 'text'}
                  disabled={isOutOfRange(period)}
                  onClick={() => {
                    onChange(period);
                    setAnchor(null);
                  }}
                >
                  {name.slice(0, 3)}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </Stack>
  );
}

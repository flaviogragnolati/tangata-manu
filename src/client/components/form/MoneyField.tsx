'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Chip, InputAdornment, Stack, TextField } from '@mui/material';
import {
  useController,
  useFormContext,
  type FieldValues,
  type Path,
} from 'react-hook-form';

import { ARSformatter } from '~/utils/helpers';
import {
  formatMoneyInput,
  parseMoney,
  percentChange,
} from '~/client/lib/money';

type Props<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Shows "Actual: $X" and the % change against it. */
  previousValue?: number | null;
};

/**
 * Text input for ARS amounts (`type="number"` rejects the thousands separator
 * and Safari reports it empty). Stores a number, `null` when empty or `NaN`
 * when unreadable, so the form schema reports the error.
 */
export default function MoneyField<T extends FieldValues>({
  name,
  label,
  helperText,
  required,
  disabled,
  previousValue,
}: Props<T>) {
  const { control } = useFormContext<T>();
  const { field, fieldState } = useController({ name, control });
  const value = field.value as number | null | undefined;
  const [text, setText] = useState(() => formatMoneyInput(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatMoneyInput(value));
  }, [value, focused]);

  const pct =
    typeof previousValue === 'number' && typeof value === 'number'
      ? percentChange(value, previousValue)
      : null;
  const hint =
    typeof previousValue === 'number' ? (
      <Stack
        component="span"
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center' }}
      >
        <span>Actual: {ARSformatter.format(previousValue)}</span>
        {!!pct && (
          <Chip
            component="span"
            size="small"
            variant="outlined"
            color={pct > 0 ? 'success' : 'warning'}
            label={`${pct > 0 ? '+' : '−'}${Math.abs(pct)}%`}
          />
        )}
      </Stack>
    ) : (
      helperText
    );

  return (
    <TextField
      name={field.name}
      inputRef={field.ref}
      label={label}
      required={required}
      disabled={disabled}
      fullWidth
      value={text}
      onFocus={() => setFocused(true)}
      onChange={(event) => {
        setText(event.target.value);
        field.onChange(parseMoney(event.target.value));
      }}
      onBlur={() => {
        setFocused(false);
        field.onBlur();
      }}
      error={!!fieldState.error}
      helperText={fieldState.error?.message ?? hint}
      slotProps={{
        input: {
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        },
        htmlInput: { inputMode: 'decimal', autoComplete: 'off' },
        formHelperText: { component: 'div' },
      }}
    />
  );
}

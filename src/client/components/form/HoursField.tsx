'use client';

import { InputAdornment } from '@mui/material';
import { TextFieldElement } from 'react-hook-form-mui';
import type { Control, FieldValues, Path } from 'react-hook-form';

type Props<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  control?: Control<T>;
  required?: boolean;
};

/** Hour amounts in half-hour steps; empty is `null` so the schema reports it. */
export default function HoursField<T extends FieldValues>({
  name,
  label,
  control,
  required,
}: Props<T>) {
  return (
    <TextFieldElement<T>
      name={name}
      label={label}
      control={control}
      type="number"
      required={required}
      fullWidth
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">h</InputAdornment>,
        },
        htmlInput: { min: 0, step: 0.5, inputMode: 'decimal' },
      }}
    />
  );
}

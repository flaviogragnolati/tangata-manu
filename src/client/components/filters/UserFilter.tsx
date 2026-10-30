'use client';

import { Autocomplete, TextField } from '@mui/material';

type Option = { id: string; label: string };

type Props = {
  users: Option[];
  value: string | null;
  onChange: (id: string | null) => void;
};

export default function UserFilter({ users, value, onChange }: Props) {
  return (
    <Autocomplete
      size="small"
      options={users}
      value={users.find((user) => user.id === value) ?? null}
      onChange={(_, option) => onChange(option?.id ?? null)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText="No se encontraron usuarios"
      sx={{ minWidth: 240 }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Usuario"
          placeholder="Todos los usuarios"
        />
      )}
    />
  );
}

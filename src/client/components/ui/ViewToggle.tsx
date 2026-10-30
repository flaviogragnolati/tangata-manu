'use client';

import ViewModuleIcon from '@mui/icons-material/ViewModule';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';

export type ViewMode = 'cards' | 'table';

const OPTIONS = [
  { value: 'cards', label: 'Tarjetas', Icon: ViewModuleIcon },
  { value: 'table', label: 'Tabla', Icon: TableRowsIcon },
] as const;

type Props = { value: ViewMode; onChange: (value: ViewMode) => void };

export default function ViewToggle({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      // Clicking the active button emits null; keep the current view
      onChange={(_, next: ViewMode | null) => next && onChange(next)}
      aria-label="Vista"
    >
      {OPTIONS.map(({ value, label, Icon }) => (
        <ToggleButton key={value} value={value} aria-label={label}>
          <Icon fontSize="small" />
          <Box
            component="span"
            sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1 }}
          >
            {label}
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

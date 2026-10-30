'use client';

import { useState, type ReactNode } from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Button, Drawer, Paper, Stack, Typography } from '@mui/material';

type Props = {
  primary?: ReactNode;
  children?: ReactNode;
  activeCount?: number;
  onClear?: () => void;
  end?: ReactNode;
};

/** `children` mount in both the desktop row and the mobile drawer; keep their state in the page. */
export default function FilterBar({
  primary,
  children,
  activeCount = 0,
  onClear,
  end,
}: Props) {
  const [open, setOpen] = useState(false);
  const canClear = activeCount > 0 && !!onClear;

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          p: 1.5,
          mb: 3,
        }}
      >
        {primary}
        {children}
        <Box sx={{ flex: 1 }} />
        {canClear && (
          <Button variant="text" onClick={onClear}>
            Limpiar filtros
          </Button>
        )}
        {end}
      </Paper>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 1,
          mb: 2,
        }}
      >
        {primary}
        <Box sx={{ flex: 1 }} />
        {children && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<TuneIcon />}
            onClick={() => setOpen(true)}
          >
            {activeCount > 0 ? `Filtros (${activeCount})` : 'Filtros'}
          </Button>
        )}
        {end}
      </Stack>

      {children && (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={() => setOpen(false)}
          slotProps={{
            paper: {
              sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            },
          }}
        >
          <Stack spacing={2} sx={{ p: 2, pb: 3 }}>
            <Typography variant="h6">Filtros</Typography>
            {children}
            <Stack
              direction="row"
              spacing={1}
              sx={{ justifyContent: 'flex-end' }}
            >
              {onClear && (
                <Button variant="text" onClick={onClear} disabled={!canClear}>
                  Limpiar
                </Button>
              )}
              <Button variant="contained" onClick={() => setOpen(false)}>
                Aplicar
              </Button>
            </Stack>
          </Stack>
        </Drawer>
      )}
    </>
  );
}

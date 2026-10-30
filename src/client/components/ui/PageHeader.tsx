'use client';

import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

type Props = { title: string; subtitle?: ReactNode; actions?: ReactNode };

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        mb: 3,
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ typography: { xs: 'h5', md: 'h4' } }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}

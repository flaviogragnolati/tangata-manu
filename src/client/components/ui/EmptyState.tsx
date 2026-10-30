'use client';

import type { ReactNode } from 'react';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Box, Stack, Typography } from '@mui/material';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dense?: boolean;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  dense = false,
}: Props) {
  return (
    <Stack
      spacing={dense ? 0.5 : 1.5}
      sx={{
        alignItems: 'center',
        textAlign: 'center',
        py: dense ? 2 : 6,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {!dense && (
        <Box sx={{ display: 'flex', fontSize: 48, color: 'text.disabled' }}>
          {icon ?? <InboxOutlinedIcon fontSize="inherit" />}
        </Box>
      )}
      <Typography
        variant={dense ? 'body2' : 'h6'}
        color={dense ? 'text.secondary' : 'text.primary'}
      >
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ pt: dense ? 1 : 1.5 }}>{action}</Box>}
    </Stack>
  );
}

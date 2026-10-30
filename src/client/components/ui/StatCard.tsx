'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'warning';
  delta?: number | null;
  href?: string;
};

export function DeltaChip({ delta }: { delta?: number | null }) {
  if (delta === null || delta === undefined) return null;
  const Icon =
    delta < 0
      ? ArrowDownwardIcon
      : delta > 0
        ? ArrowUpwardIcon
        : TrendingFlatIcon;
  return (
    <Tooltip title="Variación contra el mes anterior">
      <Chip
        size="small"
        variant="outlined"
        icon={<Icon fontSize="small" />}
        label={`${delta > 0 ? '+' : ''}${delta}%`}
      />
    </Tooltip>
  );
}

export default function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  delta,
  href,
}: Props) {
  const content = (
    <CardContent>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          <Typography
            variant="h5"
            component="p"
            sx={{ color: tone === 'warning' ? 'warning.dark' : undefined }}
          >
            {value}
          </Typography>
          {hint && (
            <Typography
              variant="caption"
              color="text.secondary"
              component="div"
              sx={{ mt: 0.5 }}
            >
              {hint}
            </Typography>
          )}
          {delta !== null && delta !== undefined && (
            <Box sx={{ mt: 1 }}>
              <DeltaChip delta={delta} />
            </Box>
          )}
        </Box>
        {icon && (
          <Box
            sx={(theme) => {
              const color =
                tone === 'warning'
                  ? theme.palette.warning.main
                  : theme.palette.primary.main;
              return {
                display: 'flex',
                p: 1,
                borderRadius: '10px',
                color,
                bgcolor: alpha(color, 0.1),
              };
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </CardContent>
  );

  return (
    <Card
      sx={{
        height: '100%',
        borderColor: tone === 'warning' ? 'warning.light' : undefined,
      }}
    >
      {href ? (
        <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

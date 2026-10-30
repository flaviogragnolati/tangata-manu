'use client';

import { Chip, Stack } from '@mui/material';

type Option = { id: number; label: string };

type Props = {
  sites: Option[];
  value: number[];
  onChange: (ids: number[]) => void;
};

export default function SiteChipsFilter({ sites, value, onChange }: Props) {
  const toggle = (id: number) =>
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );

  return (
    <Stack
      direction="row"
      spacing={1}
      role="group"
      aria-label="Sitios"
      sx={{
        flexWrap: { xs: 'nowrap', md: 'wrap' },
        overflowX: { xs: 'auto', md: 'visible' },
        rowGap: 1,
        pb: { xs: 0.5, md: 0 },
      }}
    >
      {sites.map((site) => {
        const selected = value.includes(site.id);
        return (
          <Chip
            key={site.id}
            label={site.label}
            clickable
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            aria-pressed={selected}
            onClick={() => toggle(site.id)}
          />
        );
      })}
    </Stack>
  );
}

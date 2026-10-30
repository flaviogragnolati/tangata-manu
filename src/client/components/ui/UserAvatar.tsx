'use client';

import { Avatar } from '@mui/material';

const COLORS = [
  '#0e7490',
  '#2563eb',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0d9488',
  '#4f46e5',
];

function colorFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function initialsFor(name?: string | null, email?: string | null) {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length > 1) return `${words[0]![0]}${words.at(-1)![0]}`;
  if (words.length === 1) return words[0]!.slice(0, 2);
  return email?.[0] ?? '?';
}

type Props = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: number;
};

export default function UserAvatar({ name, email, image, size = 40 }: Props) {
  const label = name ?? email ?? undefined;
  return (
    <Avatar
      src={image ?? undefined}
      alt={label}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        bgcolor: colorFor(name ?? email ?? ''),
      }}
    >
      {initialsFor(name, email).toUpperCase()}
    </Avatar>
  );
}

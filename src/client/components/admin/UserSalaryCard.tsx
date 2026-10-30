'use client';

import { useState } from 'react';
import type { User } from '@prisma/client';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';

import C from '~/constants';
import { type UserSalary } from '~/types';
import UserAvatar from '~/client/components/ui/UserAvatar';
import SalaryCard, { SalaryLine } from '~/components/admin/SalaryCard';

type Props = {
  user: User;
  salary: UserSalary[];
  extraSalary?: number;
  delta?: number | null;
  onDeactivate?: () => void;
};
export default function UserSalaryCard({
  user,
  salary,
  extraSalary,
  delta,
  onDeactivate,
}: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (!salary || salary.length === 0) {
    return null;
  }
  const canDeactivate =
    user.role === 'USER' && !user.deactivatedAt && !!onDeactivate;
  return (
    <SalaryCard
      avatar={
        <UserAvatar name={user.name} email={user.email} image={user.image} />
      }
      title={
        // Spans: the header renders the title inside a <span>
        <Stack
          component="span"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center' }}
        >
          <Box
            component="span"
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}
          >
            {user.name ?? user.email}
          </Box>
          {user.deactivatedAt && (
            <Chip component="span" size="small" label="Dado de baja" />
          )}
        </Stack>
      }
      subheader={user.name ? user.email : undefined}
      totalAmount={salary.reduce((acc, curr) => acc + curr.totalAmount, 0)}
      totalHours={salary.reduce((acc, curr) => acc + curr.totalHours, 0)}
      extraSalary={extraSalary ?? 0}
      delta={delta}
      menu={
        canDeactivate && (
          <>
            <IconButton
              size="small"
              aria-label={`Más acciones para ${user.name ?? user.email ?? 'usuario'}`}
              aria-haspopup="menu"
              onClick={(event) => setAnchor(event.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchor}
              open={!!anchor}
              onClose={() => setAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setAnchor(null);
                  onDeactivate?.();
                }}
              >
                Dar de baja al usuario
              </MenuItem>
            </Menu>
          </>
        )
      }
    >
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {salary.map((row) => (
          <Stack key={row.siteId} spacing={0.5}>
            <Typography variant="subtitle2">{row.siteName}</Typography>
            {C.rateTypes.map((rateType) => {
              const hours = row[`${rateType}Hours`];
              if (!hours) return null;
              return (
                <SalaryLine
                  key={rateType}
                  label={C.rateTypesMap[rateType]}
                  hours={hours}
                  amount={row[`${rateType}Amount`]}
                />
              );
            })}
          </Stack>
        ))}
      </Stack>
    </SalaryCard>
  );
}

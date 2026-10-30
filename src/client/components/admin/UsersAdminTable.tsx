'use client';

import type { UserRole } from '@prisma/client';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import { Box, Chip, Stack, Typography } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid';

import C from '~/constants';
import { formatDate } from '~/utils/dayjs';
import { formatPeriod } from '~/client/lib/period';
import type { UserOverview } from '~/types';
import UserAvatar from '~/client/components/ui/UserAvatar';
import GridToolbarMinimal, {
  useXsColumnVisibility,
} from '~/components/ui/GridToolbarMinimal';
import type { UserStatusAction } from '~/components/admin/UserStatusDialog';

const HIDDEN_ON_XS = ['role', 'activeUserRates'] as const;

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Profesional',
  ADMIN: 'Admin',
  SUPERADMIN: 'Superadmin',
};

type Props = {
  rows: UserOverview[];
  currentUserId: string;
  onAction: (action: UserStatusAction) => void;
};

export default function UsersAdminTable({
  rows,
  currentUserId,
  onAction,
}: Props) {
  const columnVisibility = useXsColumnVisibility(HIDDEN_ON_XS);

  const columns: GridColDef<UserOverview>[] = [
    {
      field: 'user',
      headerName: 'Usuario',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (_, row) => row.name ?? row.email,
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', height: '100%', minWidth: 0 }}
        >
          <UserAvatar
            name={row.name}
            email={row.email}
            image={row.image}
            size={32}
          />
          {/* Reset the grid cell's row-height line-height so both lines fit */}
          <Box sx={{ minWidth: 0, lineHeight: 'normal' }}>
            <Typography variant="body2" noWrap>
              {row.name ?? row.email}
            </Typography>
            {row.name && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                noWrap
              >
                {row.email}
              </Typography>
            )}
          </Box>
        </Stack>
      ),
    },
    {
      field: 'role',
      headerName: 'Rol',
      minWidth: 110,
      valueGetter: (_, row) => ROLE_LABELS[row.role],
    },
    {
      field: 'status',
      headerName: 'Estado',
      minWidth: 180,
      valueGetter: (_, row) => (row.deactivatedAt ? 'Dado de baja' : 'Activo'),
      renderCell: ({ row }) =>
        row.deactivatedAt ? (
          <Chip
            size="small"
            variant="outlined"
            label={`Dado de baja · ${formatDate(row.deactivatedAt)}`}
          />
        ) : (
          <Chip size="small" color="success" label="Activo" />
        ),
    },
    {
      field: 'activeUserRates',
      headerName: 'Tarifas por usuario vigentes',
      type: 'number',
      minWidth: 120,
    },
    {
      field: 'lastPeriod',
      headerName: 'Últimas horas',
      type: 'number',
      minWidth: 130,
      // Month index so it sorts by period; formatted back for display
      valueGetter: (_, row) =>
        row.lastPeriod ? row.lastPeriod.year * 12 + row.lastPeriod.month : null,
      valueFormatter: (value: number | null) =>
        value === null
          ? '—'
          : formatPeriod(
              { year: Math.floor(value / 12), month: value % 12 },
              C.months,
            ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 90,
      getActions: ({ id, row }) => {
        if (row.role !== 'USER' || row.id === currentUserId) return [];
        const label = row.name ?? row.email ?? 'Usuario';
        return [
          row.deactivatedAt ? (
            <GridActionsCellItem
              key={id}
              icon={<RestoreIcon />}
              label="Reactivar"
              onClick={() =>
                onAction({ kind: 'reactivate', userId: row.id, label })
              }
            />
          ) : (
            <GridActionsCellItem
              key={id}
              icon={<PersonOffOutlinedIcon />}
              label="Dar de baja"
              onClick={() =>
                onAction({ kind: 'deactivate', userId: row.id, label })
              }
            />
          ),
        ];
      },
    },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      autoHeight
      getRowId={(row) => row.id}
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={{
        pagination: { paginationModel: { pageSize: 25 } },
      }}
      slots={{ toolbar: GridToolbarMinimal }}
      {...columnVisibility}
    />
  );
}

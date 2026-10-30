'use client';

import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import {
  Button,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import type { UserOverview } from '~/types';
import { filterUsers, type UserStatusFilter } from '~/client/lib/users';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import FilterBar from '~/client/components/filters/FilterBar';
import UsersAdminTable from '~/components/admin/UsersAdminTable';
import UserStatusDialog, {
  type UserStatusAction,
} from '~/components/admin/UserStatusDialog';

type Props = { users: UserOverview[]; currentUserId: string };

export default function UsersAdminView({ users, currentUserId }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<UserStatusFilter>('active');
  const [action, setAction] = useState<UserStatusAction | null>(null);

  const rows = filterUsers(users, { query, status });
  const activeCount = Number(!!query.trim()) + Number(status !== 'active');
  const clearFilters = () => {
    setQuery('');
    setStatus('active');
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Profesionales y administradores; baja y reactivación"
      />
      <FilterBar
        activeCount={activeCount}
        onClear={clearFilters}
        primary={
          <TextField
            size="small"
            placeholder="Buscar usuario"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Buscar usuario' },
            }}
            sx={{ minWidth: { xs: 0, sm: 240 }, flex: { xs: 1, md: 'none' } }}
          />
        }
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={status}
          onChange={(_, next: UserStatusFilter | null) =>
            next && setStatus(next)
          }
          aria-label="Estado"
        >
          <ToggleButton value="active">Activos</ToggleButton>
          <ToggleButton value="deactivated">Dados de baja</ToggleButton>
          <ToggleButton value="all">Todos</ToggleButton>
        </ToggleButtonGroup>
      </FilterBar>

      {rows.length ? (
        <UsersAdminTable
          rows={rows}
          currentUserId={currentUserId}
          onAction={setAction}
        />
      ) : (
        <EmptyState
          title="No hay usuarios que coincidan"
          action={<Button onClick={clearFilters}>Limpiar filtros</Button>}
        />
      )}

      <UserStatusDialog
        key={action?.userId ?? 'closed'}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  );
}

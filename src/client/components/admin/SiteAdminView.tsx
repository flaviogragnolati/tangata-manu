'use client';

import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Button,
  Chip,
  Grid2 as Grid,
  InputAdornment,
  TextField,
} from '@mui/material';
import type { SiteRate } from '@prisma/client';

import type { SiteWithCreatedBy } from '~/types';
import { buildSiteCards, filterSites } from '~/client/lib/sites';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import ViewToggle, { type ViewMode } from '~/client/components/ui/ViewToggle';
import FilterBar from '~/client/components/filters/FilterBar';
import SiteCard from '~/components/admin/SiteCard';
import SiteAdminForm from '~/components/admin/SiteAdminForm';
import SiteAdminTable from '~/components/admin/SiteAdminTable';

type Props = { sites: SiteWithCreatedBy[]; activeRates: SiteRate[] };
type DialogState = { open: boolean; site: SiteWithCreatedBy | null };

export default function SiteAdminView({ sites, activeRates }: Props) {
  const [view, setView] = useState<ViewMode>('cards');
  const [query, setQuery] = useState('');
  const [onlySaturdays, setOnlySaturdays] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    site: null,
  });

  const cards = useMemo(
    () => buildSiteCards(sites, activeRates),
    [sites, activeRates],
  );
  const visibleCards = filterSites(cards, { query, onlySaturdays });
  const siteById = new Map(sites.map((site) => [site.id, site]));
  const rows = visibleCards.flatMap((card) => {
    const site = siteById.get(card.id);
    return site ? [{ ...site, card }] : [];
  });

  const activeCount = Number(!!query.trim()) + Number(onlySaturdays);
  const clearFilters = () => {
    setQuery('');
    setOnlySaturdays(false);
  };
  const openNew = () => setDialog({ open: true, site: null });
  const openEdit = (site: SiteWithCreatedBy) => setDialog({ open: true, site });

  return (
    <>
      <PageHeader
        title="Sitios"
        subtitle="Lugares de trabajo y su tarifa del sitio"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Nuevo sitio
          </Button>
        }
      />
      <FilterBar
        activeCount={activeCount}
        onClear={clearFilters}
        primary={
          <TextField
            size="small"
            placeholder="Buscar sitio"
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
              htmlInput: { 'aria-label': 'Buscar sitio' },
            }}
            sx={{ minWidth: { xs: 0, sm: 240 }, flex: { xs: 1, md: 'none' } }}
          />
        }
        end={<ViewToggle value={view} onChange={setView} />}
      >
        <Chip
          label="Permite sábados"
          color={onlySaturdays ? 'primary' : 'default'}
          variant={onlySaturdays ? 'filled' : 'outlined'}
          onClick={() => setOnlySaturdays((current) => !current)}
          aria-pressed={onlySaturdays}
        />
      </FilterBar>

      {!sites.length ? (
        <EmptyState
          title="Todavía no hay sitios"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNew}
            >
              Nuevo sitio
            </Button>
          }
        />
      ) : !visibleCards.length ? (
        <EmptyState
          title="No hay sitios que coincidan"
          action={<Button onClick={clearFilters}>Limpiar filtros</Button>}
        />
      ) : view === 'cards' ? (
        <Grid container spacing={2}>
          {visibleCards.map((card) => (
            <Grid key={card.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <SiteCard
                data={card}
                onEdit={() => {
                  const site = siteById.get(card.id);
                  if (site) openEdit(site);
                }}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <SiteAdminTable rows={rows} onEdit={openEdit} />
      )}

      {dialog.open && (
        <SiteAdminForm
          // defaultValues are read on mount only; remount per site
          key={dialog.site?.id ?? 'new'}
          site={dialog.site}
          open
          onClose={() => setDialog({ open: false, site: null })}
        />
      )}
    </>
  );
}

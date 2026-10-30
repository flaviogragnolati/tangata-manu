'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import {
  Button,
  Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import type { SiteRateFull } from '~/types';
import { buildSiteRateCards } from '~/client/lib/siteRates';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import ViewToggle, { type ViewMode } from '~/client/components/ui/ViewToggle';
import FilterBar from '~/client/components/filters/FilterBar';
import UserFilter from '~/client/components/filters/UserFilter';
import SiteChipsFilter from '~/client/components/filters/SiteChipsFilter';
import SiteRateCard from '~/components/admin/SiteRateCard';
import SiteRateAdminTable from '~/components/admin/SiteRateAdminTable';
import RateChangeDialog, {
  type RateDialogMode,
} from '~/components/admin/RateChangeDialog';
import RateDeletionDialog from '~/components/admin/RateDeletionDialog';

type Status = 'active' | 'all';

type Props = {
  rates: SiteRateFull[];
  sites: { id: number; label: string; allowsExtraHours: boolean }[];
  users: { id: string; label: string }[];
  initialSiteId?: number;
  /** Opens "Nueva tarifa" on load (`?nueva=1`). */
  openNew?: boolean;
};

const dialogKey = (mode: RateDialogMode | null) =>
  !mode
    ? 'closed'
    : mode.kind === 'new'
      ? `new-${mode.siteId ?? ''}`
      : `${mode.kind}-${mode.rate.id}`;

export default function SiteRateAdminView({
  rates,
  sites,
  users,
  initialSiteId,
  openNew = false,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('cards');
  const [siteIds, setSiteIds] = useState<number[]>(
    initialSiteId ? [initialSiteId] : [],
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('active');
  const [dialog, setDialog] = useState<RateDialogMode | null>(
    openNew ? { kind: 'new', siteId: initialSiteId } : null,
  );
  const [fromQuery, setFromQuery] = useState(openNew);
  const [deleting, setDeleting] = useState<SiteRateFull | null>(null);

  const cards = useMemo(() => buildSiteRateCards(sites, rates), [sites, rates]);

  const visibleCards = cards.filter(
    (card) =>
      (!siteIds.length || siteIds.includes(card.siteId)) &&
      (!userId || card.userRates.some(({ rate }) => rate.userId === userId)),
  );
  const visibleRows = rates.filter(
    (rate) =>
      (!siteIds.length || siteIds.includes(rate.siteId)) &&
      (!userId || rate.userId === userId) &&
      (status === 'all' || rate.active),
  );

  const activeCount =
    Number(siteIds.length > 0) +
    Number(!!userId) +
    Number(view === 'table' && status !== 'active');
  const clearFilters = () => {
    setSiteIds([]);
    setUserId(null);
    setStatus('active');
  };

  const openCreate = (siteId?: number) => setDialog({ kind: 'new', siteId });
  const openChange = (rate: SiteRateFull) =>
    setDialog({ kind: 'change', rate });
  const openCorrect = (rate: SiteRateFull) =>
    setDialog({ kind: 'correct', rate });
  const openRemove = (rate: SiteRateFull) =>
    setDialog({ kind: 'removeUserRate', rate });
  const closeDialog = () => {
    setDialog(null);
    // Drop `nueva` so a refresh doesn't reopen the dialog
    if (fromQuery) {
      setFromQuery(false);
      router.replace(
        initialSiteId
          ? `/admin/site-rate?siteId=${initialSiteId}`
          : '/admin/site-rate',
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Tarifas"
        subtitle="Tarifa del sitio vigente y tarifas por usuario de cada sitio"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openCreate()}
          >
            Nueva tarifa
          </Button>
        }
      />
      <FilterBar
        activeCount={activeCount}
        onClear={clearFilters}
        end={<ViewToggle value={view} onChange={setView} />}
      >
        <SiteChipsFilter sites={sites} value={siteIds} onChange={setSiteIds} />
        <UserFilter users={users} value={userId} onChange={setUserId} />
        {view === 'table' && (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={status}
            onChange={(_, next: Status | null) => next && setStatus(next)}
            aria-label="Estado"
          >
            <ToggleButton value="active">Activas</ToggleButton>
            <ToggleButton value="all">Todas</ToggleButton>
          </ToggleButtonGroup>
        )}
      </FilterBar>

      {view === 'cards' ? (
        visibleCards.length ? (
          <Grid container spacing={2}>
            {visibleCards.map((card) => (
              <Grid key={card.siteId} size={{ xs: 12, md: 6, xl: 4 }}>
                <SiteRateCard
                  data={card}
                  highlightUserId={userId}
                  onChange={openChange}
                  onRemove={openRemove}
                  onDelete={setDeleting}
                  onCreate={openCreate}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState title="No hay sitios que coincidan con los filtros" />
        )
      ) : (
        <SiteRateAdminTable
          rows={visibleRows}
          onChange={openChange}
          onCorrect={openCorrect}
          onDelete={setDeleting}
        />
      )}

      <RateChangeDialog
        // defaultValues are read on mount only; remount per operation
        key={dialogKey(dialog)}
        mode={dialog}
        onClose={closeDialog}
        rates={rates}
        sites={sites}
        users={users}
      />
      <RateDeletionDialog
        key={deleting?.id ?? 'closed'}
        rate={deleting}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

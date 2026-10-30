'use client';

import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Button,
  Grid2 as Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import type { SiteRateFull } from '~/types';
import { buildSiteRateCards } from '~/client/lib/siteRates';
import BasicModal from '~/client/components/ui/BasicModal';
import EmptyState from '~/client/components/ui/EmptyState';
import PageHeader from '~/client/components/ui/PageHeader';
import ViewToggle, { type ViewMode } from '~/client/components/ui/ViewToggle';
import FilterBar from '~/client/components/filters/FilterBar';
import UserFilter from '~/client/components/filters/UserFilter';
import SiteChipsFilter from '~/client/components/filters/SiteChipsFilter';
import SiteRateCard from '~/components/admin/SiteRateCard';
import SiteRateAdminForm from '~/components/admin/SiteRateAdminForm';
import SiteRateAdminTable from '~/components/admin/SiteRateAdminTable';

type Status = 'active' | 'all';
type ModalState = {
  open: boolean;
  rate: SiteRateFull | null;
  defaultSiteId?: number;
};

type Props = {
  rates: SiteRateFull[];
  sites: { id: number; label: string; allowsExtraHours: boolean }[];
  users: { id: string; label: string }[];
};

export default function SiteRateAdminView({ rates, sites, users }: Props) {
  const [view, setView] = useState<ViewMode>('cards');
  const [siteIds, setSiteIds] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('active');
  const [modal, setModal] = useState<ModalState>({ open: false, rate: null });

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

  const openCreate = (defaultSiteId?: number) =>
    setModal({ open: true, rate: null, defaultSiteId });
  const openEdit = (rate: SiteRateFull) => setModal({ open: true, rate });
  const setModalOpen = (open: boolean) =>
    setModal((current) => ({ ...current, open }));

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
                  onEdit={openEdit}
                  onCreate={openCreate}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <EmptyState title="No hay sitios que coincidan con los filtros" />
        )
      ) : (
        <SiteRateAdminTable rows={visibleRows} onEdit={openEdit} />
      )}

      <BasicModal
        title={modal.rate ? 'Editar tarifa' : 'Nueva tarifa'}
        dialogProps={{
          open: modal.open,
          onClose: () => setModalOpen(false),
          fullScreen: true,
        }}
      >
        <SiteRateAdminForm
          // defaultValues are read on mount only; remount per rate or site
          key={modal.rate?.id ?? `new-${modal.defaultSiteId ?? ''}`}
          siteOptions={sites}
          userOptions={users}
          rate={modal.rate}
          defaultSiteId={modal.defaultSiteId}
          setOpen={setModalOpen}
        />
      </BasicModal>
    </>
  );
}

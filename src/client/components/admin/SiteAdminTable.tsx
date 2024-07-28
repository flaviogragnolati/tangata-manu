'use client';

import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { Button, Typography } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
  type GridColDef,
} from '@mui/x-data-grid';

import { dayjs } from '~/utils/dayjs';
import { type SiteFull } from '~/types';
import BasicModal from '~/components/ui/BasicModal';
import SiteAdminForm from '~/components/admin/SiteAdminForm';

type Row = SiteFull;
type Props = { sites: SiteFull[] };

export default function SiteAdminTable({ sites }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteFull | null>(null);

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 40 },
    { field: 'name', headerName: 'Nombre', width: 150 },
    { field: 'location', headerName: 'Dirección', width: 150 },
    { field: 'description', headerName: 'Descripción', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Creado en',
      valueGetter: (_, row) => {
        return dayjs(row.createdAt).format('DD/MM/YYYY');
      },
    },
    {
      field: 'createdBy',
      headerName: 'Creado por',
      valueGetter: (_, row) => {
        return row.CreatedBy.name;
      },
    },
    {
      field: 'allowsExtraHours',
      headerName: 'Hrs. Extra',
      valueFormatter: (_, row) => (row.allowsExtraHours ? 'Sí' : 'No'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Editar',
      getActions: (params) => [
        <GridActionsCellItem
          key={params.id}
          icon={<EditIcon />}
          size="large"
          label="Edit"
          onClick={() => handleEditSite(params.row)}
        />,
      ],
    },
  ];

  const handleEditSite = (site: SiteFull) => {
    setSelectedSite(site);
    setOpen(true);
  };

  const handleCreateNewSite = () => {
    setSelectedSite(null);
    setOpen(true);
  };

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Administrador de sitios
      </Typography>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={sites}
          columns={columns}
          autoHeight
          filterMode="client"
          sortingMode="client"
          getRowId={(row) => row.id}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'bg-gray-100' : ''
          }
        />
      </div>
      <div className="container flex flex-col items-center justify-center">
        <Button
          onClick={handleCreateNewSite}
          variant="contained"
          color="primary"
          size="large"
        >
          Crear nuevo sitio
        </Button>
      </div>
      <BasicModal
        title={selectedSite ? 'Editar Sitio' : 'Crear Sitio'}
        dialogProps={{
          open,
          onClose: () => setOpen(false),
          fullScreen: true,
        }}
      >
        <SiteAdminForm site={selectedSite} setOpen={setOpen} />
      </BasicModal>
    </>
  );
}

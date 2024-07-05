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

import { type SiteFull } from '~/types';
import BasicModal from '~/components/BasicModal';
import SiteAdminForm from '~/components/admin/SiteAdminForm';

type Row = SiteFull;
type Props = { sites: SiteFull[] };

export default function SiteAdminTable({ sites }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteFull | null>(null);

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 150,
      valueGetter: (_, row) => {
        return row.CreatedBy.name;
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
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
      <Typography variant="h1" gutterBottom>
        Administrador de sitios
      </Typography>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={sites}
          columns={columns}
          checkboxSelection
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
        <SiteAdminForm site={selectedSite} />
      </BasicModal>
    </>
  );
}

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
import { type SiteRateFull } from '~/types';
import BasicModal from '~/components/BasicModal';
import SiteRateAdminForm from '~/components/admin/SiteRateAdminForm';

type Row = SiteRateFull;
type Props = {
  rates: SiteRateFull[];
  sites: { id: number; label: string }[];
  users: { id: string; label: string }[];
};

export default function SiteRateAdminTable({ rates, sites, users }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<SiteRateFull | null>(null);

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'siteName',
      headerName: 'Sitio',
      width: 100,
      valueGetter: (_, row) => row.Site.name,
    },
    {
      field: 'userName',
      headerName: 'Usuario',
      width: 100,
      valueGetter: (_, row) => row.User?.name ?? row.User?.email,
    },
    {
      field: 'normalRate',
      headerName: 'Tarifa Normal',
      width: 100,
    },
    {
      field: 'saturdayPreRate',
      headerName: 'Tarifa Sábado Pre',
      width: 100,
    },
    {
      field: 'saturdayPostRate',
      headerName: 'Tarifa sabado Post',
      width: 100,
    },
    {
      field: 'createdBy',
      headerName: 'Creado por',
      width: 150,
      valueGetter: (_, row) => {
        return row.CreatedBy.name;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Fecha Creado',
      width: 150,
      valueGetter: (_, row) => {
        return dayjs(row.createdAt).format('DD/MM/YYYY');
      },
    },
    {
      field: 'active',
      headerName: 'Activo',
      valueGetter: (_, row) => {
        return row.active ? 'Si' : 'No';
      },
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
          onClick={() => handleEditRate(params.row)}
        />,
      ],
    },
  ];

  const handleEditRate = (rate: SiteRateFull) => {
    setSelectedRate(rate);
    setOpen(true);
  };

  const handleCreateNewRate = () => {
    setSelectedRate(null);
    setOpen(true);
  };

  return (
    <>
      <Typography variant="h1" gutterBottom>
        Administrador tarifas
      </Typography>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rates}
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
            filter: {
              filterModel: {
                items: [
                  {
                    field: 'active',
                    operator: 'equals',
                    value: 'Si',
                  },
                ],
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
          onClick={handleCreateNewRate}
          variant="contained"
          color="primary"
        >
          Cargar nueva tarifa
        </Button>
      </div>
      <BasicModal
        title={selectedRate ? 'Editar Tarifa' : 'Crear Tarifa'}
        dialogProps={{
          open,
          onClose: () => setOpen(false),
          fullScreen: true,
        }}
      >
        <SiteRateAdminForm
          siteOptions={sites}
          userOptions={users}
          rate={selectedRate}
          setOpen={setOpen}
        />
      </BasicModal>
    </>
  );
}

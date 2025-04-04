'use client';

import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Typography } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
  type GridColDef,
} from '@mui/x-data-grid';

import { dayjs } from '~/utils/dayjs';
import { type SiteRateFull } from '~/types';
import BasicModal from '~/components/ui/BasicModal';
import SiteRateAdminForm from '~/components/admin/SiteRateAdminForm';

type Row = SiteRateFull;
type Props = {
  rates: SiteRateFull[];
  sites: { id: number; label: string; allowsExtraHours: boolean }[];
  users: { id: string; label: string }[];
};

export default function SiteRateAdminTable({ rates, sites, users }: Props) {
  const [openEdit, setOpenEdit] = useState(false);
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
    setOpenEdit(true);
  };

  const handleCreateNewRate = () => {
    setSelectedRate(null);
    setOpenEdit(true);
  };

  return (
    <>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Administrador de tarifas
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flexGrow: 1 }}>
          <DataGrid
            rows={rates}
            columns={columns}
            filterMode="client"
            sortingMode="client"
            getRowId={(row) => row.id}
            pageSizeOptions={[5, 10, 25, 50, 100]}
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
        <div className="container mt-2 flex flex-col items-center justify-center">
          <Button
            onClick={handleCreateNewRate}
            variant="contained"
            color="primary"
            size="large"
          >
            Cargar nueva tarifa
          </Button>
        </div>
      </Box>
      <BasicModal
        title={selectedRate ? 'Editar Tarifa' : 'Crear Tarifa'}
        dialogProps={{
          open: openEdit,
          onClose: () => setOpenEdit(false),
          fullScreen: true,
        }}
      >
        <SiteRateAdminForm
          siteOptions={sites}
          userOptions={users}
          rate={selectedRate}
          setOpen={setOpenEdit}
        />
      </BasicModal>
    </>
  );
}

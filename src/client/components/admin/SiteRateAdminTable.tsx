'use client';

import { useMemo, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { Button, Typography } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
  type GridColDef,
} from '@mui/x-data-grid';

import { type SiteRateFull } from '~/types';
import BasicModal from '~/components/BasicModal';
import SiteRateAdminForm from '~/components/admin/SiteRateAdminForm';

type Row = SiteRateFull;
type Props = { rates: SiteRateFull[] };

export default function SiteAdminTable({ rates }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<SiteRateFull | null>(null);

  const sites = useMemo(() => {
    const sites = new Map<number, string>();
    rates.forEach((rate) => {
      sites.set(rate.Site.id, rate.Site.name);
    });
    return Array.from(sites).map(([id, name]) => ({ id, label: name }));
  }, [rates]);

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'siteName',
      headerName: 'Sitio',
      width: 150,
      valueGetter: (_, row) => row.Site.name,
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
    { field: 'createdAt', headerName: 'Fecha Creado', width: 150 },
    { field: 'updatedAt', headerName: 'Fecha Actualizado', width: 150 },
    { field: 'active', headerName: 'Activo' },
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
        Administrador valores de hora de sitios
      </Typography>
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={rates}
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
            filter: {
              filterModel: {
                items: [
                  {
                    field: 'active',
                    operator: 'equals',
                    value: 'true',
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
          Crear nuevo sitio
        </Button>
      </div>
      <BasicModal
        title={
          selectedRate
            ? 'Editar Valor de Hora de Sitio'
            : 'Crear Valor de Hora de Sitio'
        }
        dialogProps={{
          open,
          onClose: () => setOpen(false),
          fullScreen: true,
        }}
      >
        <SiteRateAdminForm siteOptions={sites} rate={selectedRate} />
      </BasicModal>
    </>
  );
}

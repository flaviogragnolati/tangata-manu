'use client';

import { capitalize } from 'lodash';
import { Typography } from '@mui/material';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';

import { dayjs } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import type { HourLogWithUserFull } from '~/types';

type Row = HourLogWithUserFull;
type Props = { hourLogs: HourLogWithUserFull[] };

export default function HourLogHistoryByUser({ hourLogs }: Props) {
  const columns: GridColDef<Row>[] = [
    {
      field: 'name',
      headerName: 'Nombre',
      width: 180,
      valueGetter: (_, row) => row.User.name,
    },
    {
      field: 'year',
      headerName: 'Año',
    },
    {
      field: 'month',
      headerName: 'Mes',
      valueGetter: (_, row) =>
        capitalize(dayjs().month(row.month).format('MMMM')),
    },
    {
      field: 'site',
      headerName: 'Sitio',
      width: 100,
      valueGetter: (_, row) => row.SiteRate.Site.name,
    },
    {
      field: 'normalHours',
      headerName: 'Hrs. Normales',
      valueGetter: (_, row) => row.normalHours,
    },
    {
      field: 'saturdayPreHours',
      headerName: 'Hrs. Sábado Pre 14:00',
      valueGetter: (_, row) => row.saturdayPreHours,
    },
    {
      field: 'saturdayPostHours',
      headerName: 'Hrs. Sábado Post 14:00',
      valueGetter: (_, row) => row.saturdayPostHours,
    },
    {
      field: 'totalHours',
      headerName: 'Horas totales',
      valueGetter: (_, row) =>
        (row.normalHours ?? 0) +
        (row.saturdayPreHours ?? 0) +
        (row.saturdayPostHours ?? 0),
    },
    {
      field: 'amount',
      headerName: 'Monto',
      valueFormatter: (_, row) => ARSformatter.format(row.amount),
    },
    {
      field: 'date',
      headerName: 'Fecha de carga',
      valueGetter: (_, row) => row.createdAt,
    },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <Typography sx={{ typography: { xs: 'h4', md: 'h3' } }} gutterBottom>
        Registro de horas por usuario
      </Typography>
      <DataGrid
        rows={hourLogs}
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
  );
}

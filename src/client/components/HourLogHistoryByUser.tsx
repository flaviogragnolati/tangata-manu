'use client';

import { capitalize } from 'lodash';
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbar,
  type GridColDef,
} from '@mui/x-data-grid';

import { dayjs } from '~/utils/dayjs';
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
      // width: 60,
    },
    {
      field: 'month',
      headerName: 'Mes',
      // width: 60,
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
      // width: 50,
      valueGetter: (_, row) => row.normalHours,
    },
    {
      field: 'saturdayPreHours',
      headerName: 'Hrs. Sábado Pre 14:00',
      // width: 50,
      valueGetter: (_, row) => row.saturdayPreHours,
    },
    {
      field: 'saturdayPostHours',
      headerName: 'Hrs. Sábado Post 14:00',
      // width: 50,
      valueGetter: (_, row) => row.saturdayPostHours,
    },
    {
      field: 'totalHours',
      headerName: 'Horas totales',
      // width: 50,
      valueGetter: (_, row) =>
        (row.normalHours ?? 0) +
        (row.saturdayPreHours ?? 0) +
        (row.saturdayPostHours ?? 0),
    },
    {
      field: 'amount',
      headerName: 'Monto',
      // width: 50,
    },
    {
      field: 'date',
      headerName: 'Fecha de carga',
      // width: 100,
      valueGetter: (_, row) => row.createdAt,
    },
  ];

  return (
    <div style={{ height: 400, width: '100%' }}>
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

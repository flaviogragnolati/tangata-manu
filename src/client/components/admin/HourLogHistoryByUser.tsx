'use client';

import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Chip, Stack, Tooltip } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import C from '~/constants';
import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import type { HourLogWithUserFull } from '~/types';
import { readLastRateChange } from '~/client/lib/hourLogRates';
import { RecalculatedIcon } from '~/components/admin/UserRateSummaryCard';
import GridToolbarMinimal, {
  useXsColumnVisibility,
} from '~/components/ui/GridToolbarMinimal';

const HIDDEN_ON_XS = [
  'year',
  'saturdayPreHours',
  'saturdayPostHours',
  'date',
] as const;

type Row = HourLogWithUserFull;
type Props = { hourLogs: HourLogWithUserFull[]; outdatedIds?: Set<number> };

export default function HourLogHistoryByUser({ hourLogs, outdatedIds }: Props) {
  const columnVisibility = useXsColumnVisibility(HIDDEN_ON_XS);

  const columns: GridColDef<Row>[] = [
    {
      field: 'name',
      headerName: 'Nombre',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.User.name,
    },
    {
      field: 'year',
      headerName: 'Año',
      width: 80,
    },
    {
      field: 'month',
      headerName: 'Mes',
      minWidth: 100,
      valueGetter: (_, row) => C.months[row.month],
    },
    {
      field: 'site',
      headerName: 'Sitio',
      flex: 1,
      minWidth: 110,
      valueGetter: (_, row) => row.SiteRate.Site.name,
    },
    {
      field: 'normalHours',
      headerName: 'Hrs. normales',
      type: 'number',
      minWidth: 110,
      valueGetter: (_, row) => row.normalHours,
    },
    {
      field: 'saturdayPreHours',
      headerName: `Hrs. ${C.rateTypesMap.saturdayPre}`,
      type: 'number',
      minWidth: 120,
      valueGetter: (_, row) => row.saturdayPreHours,
    },
    {
      field: 'saturdayPostHours',
      headerName: `Hrs. ${C.rateTypesMap.saturdayPost}`,
      type: 'number',
      minWidth: 120,
      valueGetter: (_, row) => row.saturdayPostHours,
    },
    {
      field: 'totalHours',
      headerName: 'Horas totales',
      type: 'number',
      minWidth: 110,
      valueGetter: (_, row) =>
        (row.normalHours ?? 0) +
        (row.saturdayPreHours ?? 0) +
        (row.saturdayPostHours ?? 0),
    },
    {
      field: 'normalRate',
      headerName: 'Tarifa normal',
      type: 'number',
      minWidth: 110,
      valueGetter: (_, row) => row.SiteRate.normalRate,
      valueFormatter: (value: number | null) =>
        value === null ? '—' : ARSformatter.format(value),
    },
    {
      field: 'scope',
      headerName: 'Tipo',
      minWidth: 150,
      valueGetter: (_, row) =>
        row.SiteRate.userId ? 'Por usuario' : 'Del sitio',
      renderCell: ({ row, value }) => {
        const lastRateChange = readLastRateChange(row.metadata);
        return (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ alignItems: 'center', height: '100%' }}
          >
            <Chip
              size="small"
              label={value as string}
              color={row.SiteRate.userId ? 'secondary' : 'default'}
              variant={row.SiteRate.userId ? 'filled' : 'outlined'}
            />
            {outdatedIds?.has(row.id) && (
              <Tooltip title="Tarifa desactualizada">
                <WarningAmberIcon
                  color="warning"
                  fontSize="small"
                  titleAccess="Tarifa desactualizada"
                />
              </Tooltip>
            )}
            {lastRateChange && <RecalculatedIcon change={lastRateChange} />}
          </Stack>
        );
      },
    },
    {
      field: 'amount',
      headerName: 'Monto',
      type: 'number',
      minWidth: 110,
      valueFormatter: (value: number) => ARSformatter.format(value),
    },
    {
      field: 'date',
      headerName: 'Fecha de carga',
      type: 'date',
      minWidth: 120,
      valueGetter: (_, row) => new Date(row.createdAt),
      valueFormatter: (value: Date) => formatDate(value),
    },
  ];

  return (
    <DataGrid
      rows={hourLogs}
      columns={columns}
      autoHeight
      getRowId={(row) => row.id}
      pageSizeOptions={[10, 25, 50, 100]}
      initialState={{
        pagination: { paginationModel: { pageSize: 10 } },
      }}
      slots={{ toolbar: GridToolbarMinimal }}
      {...columnVisibility}
    />
  );
}

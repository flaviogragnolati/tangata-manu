'use client';

import EditIcon from '@mui/icons-material/Edit';
import { Chip } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid';

import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import type { SiteWithCreatedBy } from '~/types';
import type { SiteCardData } from '~/client/lib/sites';
import GridToolbarMinimal, {
  useXsColumnVisibility,
} from '~/components/ui/GridToolbarMinimal';

const HIDDEN_ON_XS = ['description', 'createdAt', 'createdBy'] as const;

type Row = SiteWithCreatedBy & { card: SiteCardData };
type Props = { rows: Row[]; onEdit: (site: SiteWithCreatedBy) => void };

export default function SiteAdminTable({ rows, onEdit }: Props) {
  const columnVisibility = useXsColumnVisibility(HIDDEN_ON_XS);

  const columns: GridColDef<Row>[] = [
    { field: 'name', headerName: 'Nombre', flex: 1, minWidth: 140 },
    { field: 'location', headerName: 'Ubicación', flex: 1, minWidth: 140 },
    {
      field: 'description',
      headerName: 'Descripción',
      flex: 1.5,
      minWidth: 160,
    },
    {
      field: 'allowsExtraHours',
      headerName: 'Sábados',
      minWidth: 100,
      valueGetter: (_, row) => (row.allowsExtraHours ? 'Sí' : 'No'),
      renderCell: ({ row }) =>
        row.allowsExtraHours ? (
          <Chip size="small" variant="outlined" label="Sábados" />
        ) : null,
    },
    {
      field: 'siteRate',
      headerName: 'Tarifa del sitio',
      type: 'number',
      minWidth: 130,
      valueGetter: (_, row) => row.card.siteRate?.normalRate ?? null,
      renderCell: ({ row }) =>
        row.card.siteRate ? (
          ARSformatter.format(row.card.siteRate.normalRate ?? 0)
        ) : (
          <Chip size="small" color="warning" label="Sin tarifa" />
        ),
    },
    {
      field: 'userRates',
      headerName: 'Tarifas por usuario',
      type: 'number',
      minWidth: 140,
      valueGetter: (_, row) => row.card.userRatesCount,
    },
    {
      field: 'createdAt',
      headerName: 'Creado el',
      type: 'date',
      minWidth: 110,
      valueGetter: (_, row) => new Date(row.createdAt),
      valueFormatter: (value: Date) => formatDate(value),
    },
    {
      field: 'createdBy',
      headerName: 'Creado por',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.CreatedBy.name ?? row.CreatedBy.email,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Editar',
      width: 70,
      getActions: ({ id, row }) => [
        <GridActionsCellItem
          key={id}
          icon={<EditIcon />}
          label="Editar"
          onClick={() => onEdit(row)}
        />,
      ],
    },
  ];

  return (
    <DataGrid
      rows={rows}
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

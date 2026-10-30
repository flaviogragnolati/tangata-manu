'use client';

import EditIcon from '@mui/icons-material/Edit';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Chip } from '@mui/material';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
} from '@mui/x-data-grid';

import C from '~/constants';
import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import { type SiteRateFull } from '~/types';
import GridToolbarMinimal, {
  useXsColumnVisibility,
} from '~/components/ui/GridToolbarMinimal';

const HIDDEN_ON_XS = ['id', 'createdBy', 'createdAt'] as const;

const formatRate = (value: number | null) =>
  value === null ? '—' : ARSformatter.format(value);

const logsCount = (count: number) =>
  `${count} ${count === 1 ? 'registro' : 'registros'}`;

type Row = SiteRateFull;
type Props = {
  rows: SiteRateFull[];
  onChange: (rate: SiteRateFull) => void;
  onCorrect: (rate: SiteRateFull) => void;
  onDelete: (rate: SiteRateFull) => void;
};

export default function SiteRateAdminTable({
  rows,
  onChange,
  onCorrect,
  onDelete,
}: Props) {
  const columnVisibility = useXsColumnVisibility(HIDDEN_ON_XS);

  const columns: GridColDef<Row>[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'siteName',
      headerName: 'Sitio',
      flex: 1,
      minWidth: 120,
      valueGetter: (_, row) => row.Site.name,
    },
    {
      field: 'userName',
      headerName: 'Usuario',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) =>
        row.User?.name ?? row.User?.email ?? 'Tarifa del sitio',
    },
    {
      field: 'normalRate',
      headerName: 'Normal',
      type: 'number',
      minWidth: 110,
      valueFormatter: (value: number | null) => formatRate(value),
    },
    {
      field: 'saturdayPreRate',
      headerName: C.rateTypesMap.saturdayPre,
      type: 'number',
      minWidth: 120,
      valueFormatter: (value: number | null) => formatRate(value),
    },
    {
      field: 'saturdayPostRate',
      headerName: C.rateTypesMap.saturdayPost,
      type: 'number',
      minWidth: 120,
      valueFormatter: (value: number | null) => formatRate(value),
    },
    {
      field: 'logs',
      headerName: 'Registros',
      type: 'number',
      minWidth: 100,
      valueGetter: (_, row) => row._count.UserHourLog,
    },
    {
      field: 'createdBy',
      headerName: 'Creada por',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.CreatedBy.name,
    },
    {
      field: 'createdAt',
      headerName: 'Creada el',
      type: 'date',
      minWidth: 110,
      valueGetter: (_, row) => new Date(row.createdAt),
      valueFormatter: (value: Date) => formatDate(value),
    },
    {
      field: 'active',
      headerName: 'Estado',
      minWidth: 100,
      valueGetter: (_, row) => (row.active ? 'Activa' : 'Inactiva'),
      renderCell: ({ row }) => (
        <Chip
          size="small"
          label={row.active ? 'Activa' : 'Inactiva'}
          color={row.active ? 'success' : 'default'}
          variant={row.active ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Acciones',
      width: 110,
      getActions: ({ id, row }) => [
        row.active ? (
          <GridActionsCellItem
            key={id}
            icon={<EditIcon />}
            label="Cambiar"
            onClick={() => onChange(row)}
          />
        ) : (
          <GridActionsCellItem
            key={id}
            icon={<EditNoteIcon />}
            label="Corregir"
            onClick={() => onCorrect(row)}
          />
        ),
        <GridActionsCellItem
          key={`${id}-delete`}
          showInMenu
          icon={<DeleteOutlineIcon />}
          label={
            row._count.UserHourLog > 0
              ? `Borrar (tiene ${logsCount(row._count.UserHourLog)})`
              : 'Borrar'
          }
          disabled={row._count.UserHourLog > 0}
          onClick={() => onDelete(row)}
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
      pageSizeOptions={[5, 10, 25, 50, 100]}
      initialState={{
        pagination: { paginationModel: { pageSize: 10 } },
      }}
      slots={{ toolbar: GridToolbarMinimal }}
      {...columnVisibility}
    />
  );
}

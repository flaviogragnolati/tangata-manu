'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarExport,
  type GridColumnVisibilityModel,
} from '@mui/x-data-grid';

/** Filtering lives in the page's FilterBar, so the grid only offers columns and export. */
export default function GridToolbarMinimal() {
  return (
    <GridToolbarContainer sx={{ p: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarExport
        csvOptions={{ utf8WithBom: true }}
        printOptions={{ disableToolbarButton: true }}
      />
    </GridToolbarContainer>
  );
}

/**
 * Hides `fields` on phones. Synced after mount because the server cannot know
 * the viewport; the user can still change visibility from "Columnas".
 * Pass a module-level constant: a new array each render resets the model.
 */
export function useXsColumnVisibility(fields: readonly string[]) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [model, setModel] = useState<GridColumnVisibilityModel>({});

  useEffect(() => {
    setModel(isXs ? Object.fromEntries(fields.map((f) => [f, false])) : {});
  }, [isXs, fields]);

  return {
    columnVisibilityModel: model,
    onColumnVisibilityModelChange: setModel,
  };
}

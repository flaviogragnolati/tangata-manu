'use client';
import { Roboto } from 'next/font/google';
import { alpha, createTheme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';
import { esES as dataGridEsES } from '@mui/x-data-grid/locales';
import { esES as pickersEsES } from '@mui/x-date-pickers/locales';
import type {} from '@mui/x-data-grid/themeAugmentation';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const divider = '#e2e8f0';
const headerBackground = '#f8fafc';

export const theme = createTheme(
  {
    palette: {
      // cyan-700 instead of the Logo's cyan-500 so white text keeps AA contrast
      primary: { main: '#0e7490', light: '#06b6d4', dark: '#155e75' },
      secondary: { main: '#2563eb' },
      background: { default: '#f8fafc', paper: '#ffffff' },
      text: { primary: '#0f172a', secondary: '#64748b' },
      divider,
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: roboto.style.fontFamily,
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiCard: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            borderColor: divider,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: { title: { fontWeight: 600 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: {
          colorInherit: {
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${divider}`,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: { root: { textTransform: 'none' } },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: { border: 'none' },
          columnHeader: { backgroundColor: headerBackground },
          columnHeaderTitle: { fontWeight: 600 },
          row: ({ theme }) => ({
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }),
        },
      },
    },
  },
  esES,
  dataGridEsES,
  pickersEsES,
);

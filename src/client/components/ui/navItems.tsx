'use client';

import type { ReactNode } from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SellOutlinedIcon from '@mui/icons-material/SellOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MoreTimeOutlinedIcon from '@mui/icons-material/MoreTimeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';

export type NavArea = 'admin' | 'user';

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  exact?: boolean;
};

export const NAV_ITEMS: Record<NavArea, NavItem[]> = {
  admin: [
    {
      href: '/admin',
      label: 'Inicio',
      description: 'Resumen del mes',
      icon: <HomeOutlinedIcon />,
      exact: true,
    },
    {
      href: '/admin/salaries',
      label: 'Salarios',
      description: 'Montos y aguinaldo por usuario o por sitio',
      icon: <PaymentsOutlinedIcon />,
    },
    {
      href: '/admin/users-hours',
      label: 'Horas',
      description: 'Horas cargadas y tarifa aplicada por usuario',
      icon: <ScheduleOutlinedIcon />,
    },
    {
      href: '/admin/site-rate',
      label: 'Tarifas',
      description: 'Tarifas del sitio y tarifas por usuario',
      icon: <SellOutlinedIcon />,
    },
    {
      href: '/admin/site',
      label: 'Sitios',
      description: 'Alta y edición de sitios',
      icon: <PlaceOutlinedIcon />,
    },
    {
      href: '/admin/users',
      label: 'Usuarios',
      description: 'Profesionales, baja y reactivación',
      icon: <GroupOutlinedIcon />,
    },
  ],
  user: [
    {
      href: '/user',
      label: 'Inicio',
      description: 'Resumen del mes',
      icon: <HomeOutlinedIcon />,
      exact: true,
    },
    {
      href: '/user/hour-log',
      label: 'Cargar horas',
      description: 'Registre las horas trabajadas en cada sitio',
      icon: <MoreTimeOutlinedIcon />,
    },
    {
      href: '/user/hour-log-history',
      label: 'Mis horas',
      description: 'Consulte y edite las horas cargadas',
      icon: <HistoryOutlinedIcon />,
    },
  ],
};

export function isNavItemActive(item: NavItem, pathname: string) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

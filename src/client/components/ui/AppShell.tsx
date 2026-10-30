'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type PropsWithChildren } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import Logo from '~/client/components/ui/Logo';
import UserAvatar from '~/client/components/ui/UserAvatar';
import {
  NAV_ITEMS,
  isNavItemActive,
  type NavArea,
} from '~/client/components/ui/navItems';

type Props = PropsWithChildren<{
  area: NavArea;
  user: { name?: string | null; email?: string | null; image?: string | null };
}>;

export default function AppShell({ area, user, children }: Props) {
  const pathname = usePathname();
  const items = NAV_ITEMS[area];
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            aria-label="Abrir menú de navegación"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component={Link}
            href={items[0]!.href}
            aria-label="Ir al inicio"
            sx={{ display: 'flex', textDecoration: 'none', mr: 2 }}
          >
            <Logo size="sm" />
          </Box>
          <Stack
            component="nav"
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: 'none', md: 'flex' }, flex: 1 }}
          >
            {items.map((item) => {
              const active = isNavItemActive(item, pathname);
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  sx={(theme) => ({
                    color: active ? 'primary.main' : 'text.secondary',
                    bgcolor: active
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.12),
                    },
                  })}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
          <Box sx={{ flex: { xs: 1, md: 'none' } }} />
          <IconButton
            aria-label="Menú de usuario"
            aria-haspopup="true"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <UserAvatar {...user} size={36} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1, maxWidth: 280 }}>
              <Typography variant="subtitle2" noWrap>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem component={Link} href="/api/auth/signout">
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{ p: 2 }}>
            <Logo size="sm" />
          </Box>
          <Divider />
          <List component="nav">
            {items.map((item) => (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={isNavItemActive(item, pathname)}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Container maxWidth="xl" component="main" sx={{ py: { xs: 2, md: 4 } }}>
        {children}
      </Container>
    </Box>
  );
}

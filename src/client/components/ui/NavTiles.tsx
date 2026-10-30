'use client';

import Link from 'next/link';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid2 as Grid,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { NAV_ITEMS, type NavArea } from '~/client/components/ui/navItems';

export default function NavTiles({ area }: { area: NavArea }) {
  const items = NAV_ITEMS[area].filter((item) => !item.exact);

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.href} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea
              component={Link}
              href={item.href}
              sx={{ height: '100%' }}
            >
              <CardContent>
                <Box
                  sx={(theme) => ({
                    display: 'inline-flex',
                    p: 1.25,
                    mb: 1.5,
                    borderRadius: '50%',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  })}
                >
                  {item.icon}
                </Box>
                <Typography variant="h6" component="h2">
                  {item.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

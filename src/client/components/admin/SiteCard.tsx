'use client';

import Link from 'next/link';
import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Stack,
  Typography,
} from '@mui/material';

import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import type { SiteCardData } from '~/client/lib/sites';

type Props = { data: SiteCardData; onEdit: () => void };

export const newSiteRateHref = (siteId: number) =>
  `/admin/site-rate?siteId=${siteId}&nueva=1`;

export default function SiteCard({ data, onEdit }: Props) {
  const { siteRate, userRatesCount } = data;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={data.name}
        subheader={data.location ?? undefined}
        action={
          data.allowsExtraHours ? (
            <Chip size="small" label="Sábados" variant="outlined" />
          ) : undefined
        }
        sx={{ '& .MuiCardHeader-content': { minWidth: 0 } }}
        slotProps={{ title: { noWrap: true }, subheader: { noWrap: true } }}
      />
      <CardContent sx={{ pt: 0, flex: 1 }}>
        <Stack spacing={1.5}>
          {data.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                overflowWrap: 'anywhere',
              }}
            >
              {data.description}
            </Typography>
          )}
          {siteRate ? (
            <Stack
              direction="row"
              spacing={2}
              sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <Typography variant="body2" color="text.secondary">
                Tarifa del sitio
                <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                  desde {formatDate(siteRate.since)}
                </Typography>
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {siteRate.normalRate === null
                  ? '—'
                  : `${ARSformatter.format(siteRate.normalRate)}/h`}
              </Typography>
            </Stack>
          ) : (
            <Alert
              severity="warning"
              sx={{ py: 0 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  LinkComponent={Link}
                  href={newSiteRateHref(data.id)}
                >
                  Cargar tarifa
                </Button>
              }
            >
              Sin tarifa del sitio
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            {userRatesCount === 1
              ? '1 tarifa por usuario'
              : `${userRatesCount} tarifas por usuario`}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button
          LinkComponent={Link}
          href={`/admin/site-rate?siteId=${data.id}`}
        >
          Ver tarifas
        </Button>
        <Button variant="outlined" onClick={onEdit}>
          Editar
        </Button>
      </CardActions>
    </Card>
  );
}

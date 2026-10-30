'use client';

import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import C from '~/constants';
import { formatDate } from '~/utils/dayjs';
import { ARSformatter } from '~/utils/helpers';
import type { SiteRateFull } from '~/types';
import type { SiteRateCardData } from '~/client/lib/siteRates';
import UserAvatar from '~/client/components/ui/UserAvatar';

const formatRate = (value: number | null) =>
  value === null ? '—' : ARSformatter.format(value);

type Props = {
  data: SiteRateCardData<SiteRateFull>;
  highlightUserId?: string | null;
  onChange: (rate: SiteRateFull) => void;
  onRemove: (rate: SiteRateFull) => void;
  onDelete: (rate: SiteRateFull) => void;
  onCreate: (siteId: number) => void;
};

const logsCount = (rate: SiteRateFull) =>
  `${rate._count.UserHourLog} ${rate._count.UserHourLog === 1 ? 'registro' : 'registros'}`;

export default function SiteRateCard({
  data,
  highlightUserId,
  onChange,
  onRemove,
  onDelete,
  onCreate,
}: Props) {
  const [menu, setMenu] = useState<{
    anchor: HTMLElement;
    rate: SiteRateFull;
  } | null>(null);
  const runAndClose = (action: (rate: SiteRateFull) => void) => () => {
    if (menu) action(menu.rate);
    setMenu(null);
  };
  const { siteRate, userRates, allowsExtraHours } = data;
  const rateTypes = allowsExtraHours
    ? C.rateTypes
    : C.rateTypes.filter((type) => type === 'normal');

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={data.siteName}
        subheader={
          siteRate
            ? `Vigente desde ${formatDate(siteRate.createdAt)} · ${logsCount(siteRate)}`
            : undefined
        }
        action={
          allowsExtraHours || siteRate ? (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {allowsExtraHours && (
                <Chip size="small" label="Sábados" variant="outlined" />
              )}
              {siteRate && (
                <IconButton
                  size="small"
                  aria-label="Más acciones para la tarifa del sitio"
                  aria-haspopup="menu"
                  onClick={(event) =>
                    setMenu({ anchor: event.currentTarget, rate: siteRate })
                  }
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ) : undefined
        }
        sx={{ '& .MuiCardHeader-content': { minWidth: 0 } }}
        slotProps={{ title: { noWrap: true } }}
      />
      <CardContent sx={{ pt: 0, flex: 1 }}>
        {siteRate ? (
          <Stack spacing={1}>
            {siteRateRows(siteRate, rateTypes)}
            {data.siteRateDuplicates > 0 && (
              <Alert severity="warning" sx={{ py: 0 }}>
                Hay {data.siteRateDuplicates + 1} tarifas del sitio vigentes; se
                muestra la más reciente
              </Alert>
            )}
          </Stack>
        ) : (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => onCreate(data.siteId)}
              >
                Crear
              </Button>
            }
          >
            Sin tarifa vigente
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Tarifas por usuario ({userRates.length})
        </Typography>
        {userRates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin tarifas por usuario
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {userRates.map(({ rate, duplicates, normalDiffPct }) => (
              <Stack
                key={rate.id}
                direction="row"
                spacing={1.5}
                sx={(theme) => ({
                  alignItems: 'center',
                  p: 0.75,
                  borderRadius: '8px',
                  bgcolor:
                    rate.userId === highlightUserId
                      ? alpha(theme.palette.primary.main, 0.08)
                      : undefined,
                })}
              >
                <UserAvatar
                  name={rate.User?.name}
                  email={rate.User?.email}
                  image={rate.User?.image}
                  size={32}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap>
                    {rate.User?.name ?? rate.User?.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatRate(rate.normalRate)}/h
                    {duplicates > 0 &&
                      ` · Hay ${duplicates + 1} tarifas vigentes`}
                  </Typography>
                </Box>
                {normalDiffPct !== null && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${normalDiffPct > 0 ? '+' : ''}${normalDiffPct}%`}
                  />
                )}
                <Tooltip title="Cambiar">
                  <IconButton
                    size="small"
                    aria-label={`Cambiar tarifa de ${rate.User?.name ?? rate.User?.email ?? 'usuario'}`}
                    onClick={() => onChange(rate)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  aria-label={`Más acciones para ${rate.User?.name ?? rate.User?.email ?? 'usuario'}`}
                  aria-haspopup="menu"
                  onClick={(event) =>
                    setMenu({ anchor: event.currentTarget, rate })
                  }
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {siteRate && (
          <Button onClick={() => onChange(siteRate)}>Cambiar tarifa</Button>
        )}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onCreate(data.siteId)}
        >
          Nueva tarifa
        </Button>
      </CardActions>
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        {menu?.rate.userId && (
          <MenuItem onClick={runAndClose(onRemove)}>
            Quitar tarifa por usuario
          </MenuItem>
        )}
        {menu && (
          // A disabled MenuItem shows no tooltip, so the reason goes as text
          <MenuItem
            disabled={menu.rate._count.UserHourLog > 0}
            onClick={runAndClose(onDelete)}
          >
            <ListItemText
              primary={
                menu.rate.userId ? 'Borrar tarifa' : 'Borrar tarifa del sitio'
              }
              secondary={
                menu.rate._count.UserHourLog > 0
                  ? `Tiene ${logsCount(menu.rate)}`
                  : undefined
              }
            />
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

function siteRateRows(
  rate: SiteRateFull,
  rateTypes: readonly (typeof C.rateTypes)[number][],
) {
  return rateTypes.map((type) => (
    <Stack
      key={type}
      direction="row"
      spacing={2}
      sx={{ justifyContent: 'space-between' }}
    >
      <Typography variant="body2" color="text.secondary">
        {C.rateTypesMap[type]}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
        {formatRate(rate[`${type}Rate`])}
      </Typography>
    </Stack>
  ));
}

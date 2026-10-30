'use client';

import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
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
  onEdit: (rate: SiteRateFull) => void;
  onCreate: (siteId: number) => void;
};

export default function SiteRateCard({
  data,
  highlightUserId,
  onEdit,
  onCreate,
}: Props) {
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
            ? `Vigente desde ${formatDate(siteRate.createdAt)}`
            : undefined
        }
        action={
          allowsExtraHours ? (
            <Chip size="small" label="Sábados" variant="outlined" />
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
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    aria-label={`Editar tarifa de ${rate.User?.name ?? rate.User?.email ?? 'usuario'}`}
                    onClick={() => onEdit(rate)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {siteRate && <Button onClick={() => onEdit(siteRate)}>Editar</Button>}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onCreate(data.siteId)}
        >
          Nueva tarifa
        </Button>
      </CardActions>
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

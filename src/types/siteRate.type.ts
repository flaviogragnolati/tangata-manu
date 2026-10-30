import { type RouterOutputs } from '~/trpc/shared';

export type SiteRateFull = RouterOutputs['site']['getAllSiteRates'][number];

export type RateChangePreview = RouterOutputs['site']['previewRateChange'];

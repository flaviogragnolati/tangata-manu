import { type RouterOutputs } from '~/trpc/shared';

export type SiteFull = RouterOutputs['site']['getAllSites'][number];

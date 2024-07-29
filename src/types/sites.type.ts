import type { Site, User } from '@prisma/client';
import { type RouterOutputs } from '~/trpc/shared';

export type SiteFull = RouterOutputs['site']['getAllSites'][number];

export type SiteWithCreatedBy = Site & { CreatedBy: User };

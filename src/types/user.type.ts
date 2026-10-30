import { type RouterOutputs } from '~/trpc/shared';

export type UserOverview = RouterOutputs['user']['getUsersOverview'][number];

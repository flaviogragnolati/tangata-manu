import { comparePeriods, type Period } from './period.ts';
import { normalize } from './sites.ts';

export function latestPeriodByUser(
  logs: { userId: string; year: number; month: number }[],
): Map<string, Period> {
  const latest = new Map<string, Period>();
  for (const { userId, year, month } of logs) {
    const current = latest.get(userId);
    if (!current || comparePeriods({ year, month }, current) > 0) {
      latest.set(userId, { year, month });
    }
  }
  return latest;
}

export type UserStatusFilter = 'active' | 'deactivated' | 'all';

export function filterUsers<
  U extends {
    name: string | null;
    email: string | null;
    deactivatedAt: Date | string | null;
  },
>(
  users: U[],
  { query, status }: { query: string; status: UserStatusFilter },
): U[] {
  const needle = normalize(query.trim());
  return users.filter(
    (user) =>
      (status === 'all' ||
        (status === 'deactivated') === !!user.deactivatedAt) &&
      (!needle ||
        normalize(`${user.name ?? ''} ${user.email ?? ''}`).includes(needle)),
  );
}

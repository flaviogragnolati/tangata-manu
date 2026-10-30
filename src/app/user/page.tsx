import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import { getServerAuthSession } from '~/server/auth';
import { currentPeriod } from '~/client/lib/period';
import { summarizeUserPeriod } from '~/client/lib/summaries';
import UserHome from '~/components/user/UserHome';

export default async function UserHomePage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    redirect('/api/auth/signin');
  }
  const period = currentPeriod();
  // No `date`: the router would read its month in the server's UTC
  const hours = await api.hours.getUserHourLogs();

  return (
    <UserHome
      userName={session.user.name ?? null}
      period={period}
      summary={summarizeUserPeriod(hours, period)}
      deactivated={!!session.user.deactivatedAt}
    />
  );
}

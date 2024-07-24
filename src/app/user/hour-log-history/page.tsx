import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import BackButton from '~/client/components/ui/BackButton';
import { getServerAuthSession } from '~/server/auth';
import HourLogHistory from '~/components/user/HourLogHistory';

export default async function HourLogHistoryPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return redirect('/api/auth/signin');
  }
  const hours = await api.hours.getUserHourLogs();

  return (
    <div className="container">
      <BackButton href="/user" />
      <HourLogHistory hours={hours} />
    </div>
  );
}

import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import BackButton from '~/components/BackButton';
import HourLogForm from '~/components/HourLogForm';
import { getServerAuthSession } from '~/server/auth';

export default async function HourLogPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/api/auth/signin');
  }

  const sites = await api.site.getAllSites();
  const previousHourLogs = await api.hours.getUserContextHourLogs({
    userId,
  });

  return (
    <div className="container">
      <BackButton href="/user" />
      <HourLogForm sites={sites} previousHourLogs={previousHourLogs} />
    </div>
  );
}

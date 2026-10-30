import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import HourLogForm from '~/components/user/HourLogForm';
import { getServerAuthSession } from '~/server/auth';

export default async function HourLogPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const sites = await api.site.getAllSites();
  const previousHourLogs = await api.hours.getUserContextHourLogs();

  return <HourLogForm sites={sites} previousHourLogs={previousHourLogs} />;
}

import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import HourLogForm from '~/components/user/HourLogForm';
import EmptyState from '~/client/components/ui/EmptyState';
import { getServerAuthSession } from '~/server/auth';

export default async function HourLogPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  if (session.user.deactivatedAt) {
    return (
      <EmptyState
        title="Su usuario está dado de baja"
        description="No puede cargar horas. Consulte al administrador."
      />
    );
  }

  const sites = await api.site.getAllSites();
  const previousHourLogs = await api.hours.getUserContextHourLogs();

  return <HourLogForm sites={sites} previousHourLogs={previousHourLogs} />;
}

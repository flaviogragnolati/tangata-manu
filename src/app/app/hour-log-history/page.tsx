import Link from 'next/link';
import { redirect } from 'next/navigation';

import { api } from '~/trpc/server';
import { getServerAuthSession } from '~/server/auth';
import HourLogHistory from '~/client/components/HourLogHistory';

export default async function HourLogHistoryPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return redirect('/api/auth/signin');
  }
  const hours = await api.hours.getUserHourLogs();
  return (
    <div>
      <Link href="/app">Volver al menu</Link>
      <h1>Historial de horas</h1>
      <HourLogHistory hours={hours} />
    </div>
  );
}
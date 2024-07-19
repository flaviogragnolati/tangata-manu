import Link from 'next/link';
import { capitalize } from 'lodash';
import { redirect } from 'next/navigation';
import HourLogForm from '~/components/HourLogForm';

import { api } from '~/trpc/server';
import Title from '~/components/Title';
import { getServerAuthSession } from '~/server/auth';

export default async function HourLogPage() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/api/auth/signin');
  }

  const sites = await api.site.getAllSites();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const date = new Date(currentYear, currentMonth);
  const previousHourLogs = await api.hours.getUserHourLogs({
    userId,
    date,
  });

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4">
      <Link href="/app">Volver al menu</Link>
      <Title>Administrador de horas</Title>
      <HourLogForm sites={sites} previousHourLogs={previousHourLogs} />
    </div>
  );
}

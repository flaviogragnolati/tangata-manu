import Link from 'next/link';
import HourLogHistoryByUser from '~/components/HourLogHistoryByUser';

import { api } from '~/trpc/server';

export default async function UsersHoursAdminPage() {
  const allHours = await api.hours.getAllHourLogs();

  return (
    <div className="container">
      <Link href="/admin">Volver al menu</Link>
      <HourLogHistoryByUser hourLogs={allHours} />
    </div>
  );
}

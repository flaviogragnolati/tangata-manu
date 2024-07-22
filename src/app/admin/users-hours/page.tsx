import { api } from '~/trpc/server';
import BackButton from '~/components/BackButton';
import HourLogHistoryByUser from '~/components/HourLogHistoryByUser';

export default async function UsersHoursAdminPage() {
  const allHours = await api.hours.getAllHourLogs();

  return (
    <div className="container">
      <BackButton href="/admin" />
      <HourLogHistoryByUser hourLogs={allHours} />
    </div>
  );
}

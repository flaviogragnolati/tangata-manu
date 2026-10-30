import { api } from '~/trpc/server';
import HourLogHistoryByUser from '~/components/admin/HourLogHistoryByUser';

export default async function UsersHoursAdminPage() {
  const allHours = await api.hours.getAllHourLogs();

  return <HourLogHistoryByUser hourLogs={allHours} />;
}

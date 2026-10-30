import { api } from '~/trpc/server';
import UsersHoursAdminView from '~/components/admin/UsersHoursAdminView';

export default async function UsersHoursAdminPage() {
  const [hourLogs, users, activeRates, sites] = await Promise.all([
    api.hours.getAllHourLogs(),
    api.user.getUsers(),
    api.site.getActiveSiteRates(),
    api.site.getAllSites(),
  ]);

  return (
    <UsersHoursAdminView
      hourLogs={hourLogs}
      users={users
        .filter((user) => user.role === 'USER')
        .map(({ id, name, email, image }) => ({ id, name, email, image }))}
      activeRates={activeRates}
      sites={sites.map((site) => ({ id: site.id, label: site.name }))}
    />
  );
}

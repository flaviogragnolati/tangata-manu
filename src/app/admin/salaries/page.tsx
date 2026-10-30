import { api } from '~/trpc/server';
import SalariesDashboard from '~/components/admin/SalariesDashboard';

export default async function UserSalariesPage() {
  const users = await api.user.getUsers();
  const sites = await api.site.getAllSites();
  const salaries = await api.hours.getUsersSalaries();
  const currentRates = await api.site.getActiveSiteRates();

  return (
    <SalariesDashboard
      salaries={salaries}
      users={users}
      sites={sites}
      rates={currentRates}
    />
  );
}

import { api } from '~/trpc/server';
import BackButton from '~/client/components/ui/BackButton';
import SalariesDashboard from '~/components/admin/SalariesDashboard';

export default async function UserSalariesPage() {
  const users = await api.user.getUsers();
  const sites = await api.site.getAllSites();
  const salaries = await api.hours.getUsersSalaries();

  return (
    <div className="container">
      <BackButton href="/admin" />
      <SalariesDashboard salaries={salaries} users={users} sites={sites} />
    </div>
  );
}

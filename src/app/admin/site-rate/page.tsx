import { api } from '~/trpc/server';
import BackButton from '~/client/components/ui/BackButton';
import SiteRateAdminTable from '~/components/admin/SiteRateAdminTable';

export default async function SiteRateAdminPage() {
  const rates = await api.site.getAllSiteRates();
  const sites = await api.site.getAllSites();
  const users = await api.user.getUsers();

  const siteOptions = sites.map((site) => ({
    id: site.id,
    label: site.name,
    allowsExtraHours: !!site.allowsExtraHours,
  }));
  const userOptions = users
    .filter((user) => user.role === 'USER')
    .map((user) => ({
      id: user.id,
      label: user.name ?? user.email!,
    }));
  return (
    <div className="container">
      <BackButton href="/admin" />
      <SiteRateAdminTable
        rates={rates}
        sites={siteOptions}
        users={userOptions}
      />
    </div>
  );
}

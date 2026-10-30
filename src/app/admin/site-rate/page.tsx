import { api } from '~/trpc/server';
import SiteRateAdminView from '~/components/admin/SiteRateAdminView';

type Props = { searchParams: { siteId?: string; nueva?: string } };

export default async function SiteRateAdminPage({ searchParams }: Props) {
  const siteId = Number(searchParams.siteId);
  const rates = await api.site.getAllSiteRates();
  const sites = await api.site.getAllSites();
  const users = await api.user.getUsers();

  const siteOptions = sites.map((site) => ({
    id: site.id,
    label: site.name,
    allowsExtraHours: !!site.allowsExtraHours,
  }));
  const userOptions = users
    .filter((user) => user.role === 'USER' && !user.deactivatedAt)
    .map((user) => ({
      id: user.id,
      label: user.name ?? user.email!,
    }));
  return (
    <SiteRateAdminView
      rates={rates}
      sites={siteOptions}
      users={userOptions}
      initialSiteId={
        sites.some((site) => site.id === siteId) ? siteId : undefined
      }
      openNew={searchParams.nueva === '1'}
    />
  );
}

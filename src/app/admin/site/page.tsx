import { api } from '~/trpc/server';
import type { SiteWithCreatedBy } from '~/types';
import SiteAdminView from '~/components/admin/SiteAdminView';

export default async function SiteAdminPage() {
  const [sites, activeRates] = await Promise.all([
    api.site.getAllSites({ includeCreatedBy: true }),
    api.site.getActiveSiteRates(),
  ]);
  return (
    <SiteAdminView
      sites={sites as unknown as SiteWithCreatedBy[]} // getAllSites' output type doesn't narrow on includeCreatedBy
      activeRates={activeRates}
    />
  );
}

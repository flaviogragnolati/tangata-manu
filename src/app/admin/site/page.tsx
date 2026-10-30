import { api } from '~/trpc/server';
import type { SiteWithCreatedBy } from '~/types';
import SiteAdminTable from '~/components/admin/SiteAdminTable';

export default async function SiteAdminPage() {
  const sites = (await api.site.getAllSites({
    includeCreatedBy: true,
  })) as unknown as SiteWithCreatedBy[]; // TODO: Fix this type cast
  return <SiteAdminTable sites={sites} />;
}

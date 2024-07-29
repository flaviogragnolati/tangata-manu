import { api } from '~/trpc/server';
import type { SiteWithCreatedBy } from '~/types';
import BackButton from '~/client/components/ui/BackButton';
import SiteAdminTable from '~/components/admin/SiteAdminTable';

export default async function SiteAdminPage() {
  const sites = (await api.site.getAllSites({
    includeCreatedBy: true,
  })) as unknown as SiteWithCreatedBy[]; // TODO: Fix this type cast
  return (
    <div className="container">
      <BackButton href="/admin" />
      <SiteAdminTable sites={sites} />;
    </div>
  );
}

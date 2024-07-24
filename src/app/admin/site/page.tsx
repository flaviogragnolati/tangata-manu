import { api } from '~/trpc/server';
import BackButton from '~/client/components/ui/BackButton';
import SiteAdminTable from '~/components/admin/SiteAdminTable';

export default async function SiteAdminPage() {
  const sites = await api.site.getAllSites();
  return (
    <div className="container">
      <BackButton href="/admin" />
      <SiteAdminTable sites={sites} />;
    </div>
  );
}

import Link from 'next/link';

import { api } from '~/trpc/server';
import SiteAdminTable from '~/components/admin/SiteAdminTable';

export default async function SiteAdminPage() {
  const sites = await api.site.getAllSites();

  return (
    <div className="container">
      <Link href="/superadmin">Volver al menu</Link>
      <SiteAdminTable sites={sites} />;
    </div>
  );
}

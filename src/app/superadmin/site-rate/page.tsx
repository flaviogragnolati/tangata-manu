import Link from 'next/link';

import { api } from '~/trpc/server';
import SiteRateAdminTable from '~/components/admin/SiteRateAdminTable';

export default async function SiteRateAdminPage() {
  const rates = await api.site.getAllSiteRates();

  return (
    <div className="container">
      <Link href="/superadmin">Volver al menu</Link>
      <SiteRateAdminTable rates={rates} />;
    </div>
  );
}

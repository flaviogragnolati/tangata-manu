import Link from 'next/link';

import { api } from '~/trpc/server';
import SiteRateAdminTable from '~/components/admin/SiteRateAdminTable';

export default async function SiteRateAdminPage() {
  const rates = await api.site.getAllSiteRates();
  const sites = await api.site.getAllSites();

  const siteOptions = sites.map((site) => ({ id: site.id, label: site.name }));
  return (
    <div className="container">
      <Link href="/admin">Volver al menu</Link>
      <SiteRateAdminTable rates={rates} sites={siteOptions} />;
    </div>
  );
}

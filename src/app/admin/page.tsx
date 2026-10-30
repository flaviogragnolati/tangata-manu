import { api } from '~/trpc/server';
import { getServerAuthSession } from '~/server/auth';
import { currentPeriod } from '~/client/lib/period';
import { sitesWithoutSiteRate } from '~/client/lib/siteRates';
import { summarizeSalaries } from '~/client/lib/summaries';
import AdminHome from '~/components/admin/AdminHome';

export default async function AdminHomePage() {
  const period = currentPeriod();
  const session = await getServerAuthSession();
  const [salaries, sites, activeRates] = await Promise.all([
    api.hours.getUsersSalaries({ year: period.year, month: period.month }),
    api.site.getAllSites(),
    api.site.getActiveSiteRates(),
  ]);

  return (
    <AdminHome
      userName={session?.user.name ?? null}
      period={period}
      summary={summarizeSalaries(salaries.userSalaries)}
      sitesWithoutRate={sitesWithoutSiteRate(sites, activeRates).map(
        ({ id, name }) => ({ id, name }),
      )}
    />
  );
}

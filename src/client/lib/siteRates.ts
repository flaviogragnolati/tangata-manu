/** Sites without a Tarifa del sitio vigente (an active rate with no `userId`). */
export function sitesWithoutSiteRate<S extends { id: number }>(
  sites: S[],
  activeRates: { siteId: number; userId: string | null; active: boolean }[],
): S[] {
  const covered = new Set(
    activeRates
      .filter((rate) => rate.active && !rate.userId)
      .map((rate) => rate.siteId),
  );
  return sites.filter((site) => !covered.has(site.id));
}

export type RateLike = {
  id: number;
  siteId: number;
  userId: string | null;
  active: boolean;
  createdAt: Date;
  normalRate: number | null;
  saturdayPreRate: number | null;
  saturdayPostRate: number | null;
};

type RateUser = {
  name: string | null;
  email: string | null;
  image?: string | null;
};

export type SiteRateCardData<R> = {
  siteId: number;
  siteName: string;
  allowsExtraHours: boolean;
  siteRate: R | null;
  siteRateDuplicates: number;
  userRates: { rate: R; duplicates: number; normalDiffPct: number | null }[];
};

// Dates may arrive serialized as strings
const createdTime = (rate: RateLike) => new Date(rate.createdAt).getTime();

function newestFirst<R extends RateLike>(rates: R[]): R[] {
  return [...rates].sort((a, b) => createdTime(b) - createdTime(a));
}

/**
 * Tarifa aplicable: the user's active rate for the site, else the site's,
 * with the same precedence as `addUserHourLog`. With duplicated active rates
 * this picks the newest, while the backend takes whichever the DB returns.
 */
export function resolveApplicableRate<R extends RateLike>(
  rates: R[],
  siteId: number,
  userId: string,
): R | null {
  const active = newestFirst(
    rates.filter((rate) => rate.active && rate.siteId === siteId),
  );
  return (
    active.find((rate) => rate.userId === userId) ??
    active.find((rate) => !rate.userId) ??
    null
  );
}

function pctDiff(value: number | null, base: number | null) {
  if (!base || value === null) return null;
  return Math.round(((value - base) / base) * 100);
}

export function buildSiteRateCards<
  R extends RateLike & { User?: RateUser | null },
>(
  sites: { id: number; label: string; allowsExtraHours: boolean }[],
  rates: R[],
): SiteRateCardData<R>[] {
  const active = newestFirst(rates.filter((rate) => rate.active));

  return sites
    .map((site) => {
      const siteActive = active.filter((rate) => rate.siteId === site.id);
      const siteRates = siteActive.filter((rate) => !rate.userId);
      const siteRate = siteRates[0] ?? null;

      const byUser = new Map<string, R[]>();
      for (const rate of siteActive) {
        if (!rate.userId) continue;
        byUser.set(rate.userId, [...(byUser.get(rate.userId) ?? []), rate]);
      }
      const userRates = [...byUser.values()]
        .map(([rate, ...rest]) => ({
          rate: rate!,
          duplicates: rest.length,
          normalDiffPct: pctDiff(
            rate!.normalRate,
            siteRate?.normalRate ?? null,
          ),
        }))
        .sort((a, b) =>
          userLabel(a.rate).localeCompare(userLabel(b.rate), 'es'),
        );

      return {
        siteId: site.id,
        siteName: site.label,
        allowsExtraHours: site.allowsExtraHours,
        siteRate,
        siteRateDuplicates: Math.max(siteRates.length - 1, 0),
        userRates,
      };
    })
    .sort((a, b) => a.siteName.localeCompare(b.siteName, 'es'));
}

function userLabel(rate: { User?: RateUser | null }) {
  return rate.User?.name ?? rate.User?.email ?? '';
}

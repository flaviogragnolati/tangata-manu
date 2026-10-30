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

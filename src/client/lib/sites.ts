import type { RateLike } from './siteRates.ts';

export type SiteCardData = {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  allowsExtraHours: boolean;
  siteRate: { normalRate: number | null; since: Date } | null;
  userRatesCount: number;
};

type SiteLike = {
  id: number;
  name: string;
  location: string | null;
  description: string | null;
  allowsExtraHours: boolean | null;
};

// Dates may arrive serialized as strings
const createdTime = (rate: RateLike) => new Date(rate.createdAt).getTime();

export function buildSiteCards(
  sites: SiteLike[],
  activeRates: RateLike[],
): SiteCardData[] {
  return sites
    .map((site) => {
      const active = activeRates.filter(
        (rate) => rate.active && rate.siteId === site.id,
      );
      // With duplicated Tarifas del sitio vigentes, the newest one counts
      const siteRate =
        active
          .filter((rate) => !rate.userId)
          .sort((a, b) => createdTime(b) - createdTime(a))[0] ?? null;
      const users = new Set(
        active.flatMap((rate) => (rate.userId ? [rate.userId] : [])),
      );

      return {
        id: site.id,
        name: site.name,
        location: site.location,
        description: site.description,
        allowsExtraHours: !!site.allowsExtraHours,
        siteRate: siteRate
          ? {
              normalRate: siteRate.normalRate,
              since: new Date(siteRate.createdAt),
            }
          : null,
        userRatesCount: users.size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Lowercase without diacritics, so "medico" finds "Médico". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export function filterSites(
  cards: SiteCardData[],
  { query, onlySaturdays }: { query: string; onlySaturdays: boolean },
): SiteCardData[] {
  const needle = normalize(query.trim());
  return cards.filter(
    (card) =>
      (!onlySaturdays || card.allowsExtraHours) &&
      (!needle ||
        normalize(`${card.name} ${card.location ?? ''}`).includes(needle)),
  );
}

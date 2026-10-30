import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildSiteCards, filterSites } from './sites.ts';

/** @param {Partial<import('./siteRates.ts').RateLike>} overrides */
const rate = (overrides) => ({
  id: 1,
  siteId: 1,
  userId: null,
  active: true,
  createdAt: new Date('2026-01-01'),
  normalRate: 1000,
  saturdayPreRate: null,
  saturdayPostRate: null,
  ...overrides,
});

/**
 * @param {number} id
 * @param {string} name
 * @param {Partial<{ location: string | null; allowsExtraHours: boolean | null }>} [overrides]
 */
const site = (id, name, overrides = {}) => ({
  id,
  name,
  location: null,
  description: null,
  allowsExtraHours: false,
  ...overrides,
});

await test('a site without rates has no Tarifa del sitio and no user rates', () => {
  const [card] = buildSiteCards([site(1, 'Centro')], []);

  assert.equal(card?.siteRate, null);
  assert.equal(card?.userRatesCount, 0);
  assert.equal(card?.allowsExtraHours, false);
});

await test('the newest Tarifa del sitio vigente is shown and user rates count once per user', () => {
  const [card] = buildSiteCards(
    [site(1, 'Centro', { allowsExtraHours: null })],
    [
      rate({ id: 1, createdAt: new Date('2026-01-01') }),
      rate({ id: 2, normalRate: 1500, createdAt: new Date('2026-05-01') }),
      rate({ id: 3, userId: 'ana' }),
      rate({ id: 4, userId: 'ana', createdAt: new Date('2026-02-01') }),
      rate({ id: 5, userId: 'beto', active: false }),
      rate({ id: 6, siteId: 2, userId: 'carla' }),
    ],
  );

  assert.deepEqual(card?.siteRate, {
    normalRate: 1500,
    since: new Date('2026-05-01'),
  });
  assert.equal(card?.userRatesCount, 1);
  assert.equal(card?.allowsExtraHours, false);
});

await test('cards are sorted by name and the search ignores case and accents', () => {
  const cards = buildSiteCards(
    [
      site(1, 'Norte', { location: 'Av. Córdoba 100' }),
      site(2, 'Médico Norte'),
      site(3, 'Centro', { allowsExtraHours: true }),
    ],
    [],
  );

  assert.deepEqual(
    cards.map((card) => card.name),
    ['Centro', 'Médico Norte', 'Norte'],
  );
  assert.deepEqual(
    filterSites(cards, { query: 'medico', onlySaturdays: false }).map(
      (card) => card.id,
    ),
    [2],
  );
  assert.deepEqual(
    filterSites(cards, { query: 'CORDOBA', onlySaturdays: false }).map(
      (card) => card.id,
    ),
    [1],
  );
  assert.deepEqual(
    filterSites(cards, { query: '', onlySaturdays: true }).map(
      (card) => card.id,
    ),
    [3],
  );
});

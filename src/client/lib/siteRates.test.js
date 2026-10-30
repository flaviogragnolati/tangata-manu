import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSiteRateCards,
  resolveApplicableRate,
  sitesWithoutSiteRate,
} from './siteRates.ts';

/** @param {Partial<import('./siteRates.ts').RateLike> & { User?: { name: string | null; email: string | null } | null }} overrides */
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
 * @param {string} [label]
 */
const site = (id, label = `Sitio ${id}`) => ({
  id,
  label,
  allowsExtraHours: false,
});

await test('sitesWithoutSiteRate ignores Tarifas por usuario', () => {
  const sites = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const rates = [
    { siteId: 1, userId: null, active: true },
    { siteId: 2, userId: 'ana', active: true },
    { siteId: 3, userId: null, active: false },
  ];

  assert.deepEqual(sitesWithoutSiteRate(sites, rates), [{ id: 2 }, { id: 3 }]);
});

await test('resolveApplicableRate prefers the Tarifa por usuario', () => {
  const siteRate = rate({ id: 1 });
  const userRate = rate({ id: 2, userId: 'ana' });
  const rates = [siteRate, userRate];

  assert.equal(resolveApplicableRate(rates, 1, 'ana'), userRate);
  assert.equal(resolveApplicableRate(rates, 1, 'beto'), siteRate);
  assert.equal(resolveApplicableRate(rates, 2, 'ana'), null);
});

await test('resolveApplicableRate ignores inactive rates', () => {
  const rates = [
    rate({ id: 1 }),
    rate({ id: 2, userId: 'ana', active: false }),
  ];

  assert.equal(resolveApplicableRate(rates, 1, 'ana')?.id, 1);
});

await test('buildSiteRateCards keeps sites without rates', () => {
  const [card] = buildSiteRateCards([site(1)], []);

  assert.equal(card?.siteRate, null);
  assert.equal(card?.siteRateDuplicates, 0);
  assert.deepEqual(card?.userRates, []);
});

await test('buildSiteRateCards shows the newest of duplicated Tarifas del sitio', () => {
  const [card] = buildSiteRateCards(
    [site(1)],
    [
      rate({ id: 1, createdAt: new Date('2026-01-01') }),
      // A string date, as if it had crossed a serialization boundary
      rate({
        id: 2,
        createdAt: /** @type {Date} */ (
          /** @type {unknown} */ ('2026-03-01T00:00:00.000Z')
        ),
      }),
    ],
  );

  assert.equal(card?.siteRate?.id, 2);
  assert.equal(card?.siteRateDuplicates, 1);
});

await test('buildSiteRateCards compares Tarifas por usuario with the site', () => {
  const [card] = buildSiteRateCards(
    [site(1)],
    [
      rate({ id: 1, normalRate: 1000 }),
      rate({
        id: 2,
        userId: 'ana',
        normalRate: 1120,
        User: { name: 'Ana', email: null },
      }),
      rate({
        id: 3,
        userId: 'ana',
        normalRate: 900,
        User: { name: 'Ana', email: null },
        createdAt: new Date('2025-01-01'),
      }),
      rate({ id: 4, userId: 'beto', active: false }),
    ],
  );

  assert.equal(card?.userRates.length, 1);
  assert.equal(card?.userRates[0]?.rate.id, 2);
  assert.equal(card?.userRates[0]?.duplicates, 1);
  assert.equal(card?.userRates[0]?.normalDiffPct, 12);
});

await test('buildSiteRateCards has no % without a Tarifa del sitio', () => {
  const [card] = buildSiteRateCards(
    [site(1)],
    [rate({ id: 2, userId: 'ana', normalRate: 1200 })],
  );

  assert.equal(card?.siteRate, null);
  assert.equal(card?.userRates[0]?.normalDiffPct, null);
});

await test('buildSiteRateCards sorts sites by name', () => {
  const cards = buildSiteRateCards([site(1, 'Norte'), site(2, 'Centro')], []);

  assert.deepEqual(
    cards.map((card) => card.siteName),
    ['Centro', 'Norte'],
  );
});

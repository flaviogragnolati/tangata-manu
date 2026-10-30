import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildUserRateSummaries } from './hourLogRates.ts';

/** @param {Partial<import('./siteRates.ts').RateLike>} overrides */
const rate = (overrides) => ({
  id: 1,
  siteId: 1,
  userId: null,
  active: true,
  createdAt: new Date('2026-01-01'),
  normalRate: 1000,
  saturdayPreRate: 1500,
  saturdayPostRate: 2000,
  ...overrides,
});

/**
 * @param {import('./siteRates.ts').RateLike} siteRate
 * @param {Partial<import('./hourLogRates.ts').HourLogLike>} overrides
 */
const log = (siteRate, overrides) => ({
  id: 1,
  userId: 'ana',
  year: 2026,
  month: 9,
  siteRateId: siteRate.id,
  normalHours: 10,
  saturdayPreHours: null,
  saturdayPostHours: 2,
  amount: 14000,
  SiteRate: {
    ...siteRate,
    Site: { id: siteRate.siteId, name: `Sitio ${siteRate.siteId}` },
  },
  ...overrides,
});

const ana = { id: 'ana', name: 'Ana', email: 'ana@x.com', image: null };
const beto = { id: 'beto', name: 'Beto', email: 'beto@x.com', image: null };
const october = { year: 2026, month: 9 };

await test('a log priced with the current Tarifa del sitio is up to date', () => {
  const siteRate = rate({ id: 1 });
  const [summary] = buildUserRateSummaries({
    hourLogs: [log(siteRate, {})],
    users: [ana],
    activeRates: [siteRate],
    period: october,
  });
  const row = summary?.months[1].rows[0];

  assert.equal(row?.scope, 'site');
  assert.equal(row?.isOutdated, false);
  assert.deepEqual(row?.hours, {
    normal: 10,
    saturdayPre: 0,
    saturdayPost: 2,
    total: 12,
  });
  assert.equal(summary?.months[1].totalAmount, 14000);
});

await test('a Tarifa del sitio replaced without retroactive update is outdated', () => {
  const oldRate = rate({ id: 1, active: false });
  const newRate = rate({ id: 2, normalRate: 1200 });
  const [summary] = buildUserRateSummaries({
    hourLogs: [log(oldRate, {})],
    users: [ana],
    activeRates: [newRate],
    period: october,
  });

  assert.equal(summary?.months[1].rows[0]?.isOutdated, true);
});

await test('a Tarifa por usuario created after the log makes it outdated', () => {
  const siteRate = rate({ id: 1 });
  const userRate = rate({ id: 2, userId: 'ana', normalRate: 1300 });
  const [summary] = buildUserRateSummaries({
    hourLogs: [log(siteRate, {})],
    users: [ana],
    activeRates: [siteRate, userRate],
    period: october,
  });

  assert.equal(summary?.months[1].rows[0]?.isOutdated, true);
});

await test('a log priced with a Tarifa por usuario has user scope', () => {
  const userRate = rate({ id: 2, userId: 'ana' });
  const [summary] = buildUserRateSummaries({
    hourLogs: [log(userRate, {})],
    users: [ana],
    activeRates: [rate({ id: 1 }), userRate],
    period: october,
  });

  assert.equal(summary?.months[1].rows[0]?.scope, 'user');
  assert.equal(summary?.months[1].rows[0]?.isOutdated, false);
});

await test('users without logs get two empty months', () => {
  const summaries = buildUserRateSummaries({
    hourLogs: [],
    users: [beto, ana],
    activeRates: [],
    period: october,
  });

  assert.deepEqual(
    summaries.map((s) => s.userId),
    ['ana', 'beto'],
  );
  assert.deepEqual(summaries[0]?.months, [
    {
      period: { year: 2026, month: 8 },
      rows: [],
      totalHours: 0,
      totalAmount: 0,
    },
    { period: october, rows: [], totalHours: 0, totalAmount: 0 },
  ]);
});

await test('in January the previous period is December of the previous year', () => {
  const siteRate = rate({ id: 1 });
  const [summary] = buildUserRateSummaries({
    hourLogs: [
      log(siteRate, { id: 1, year: 2025, month: 11 }),
      log(siteRate, { id: 2, year: 2026, month: 0 }),
      log(siteRate, { id: 3, year: 2026, month: 11 }),
    ],
    users: [ana],
    activeRates: [siteRate],
    period: { year: 2026, month: 0 },
  });

  assert.deepEqual(summary?.months[0].period, { year: 2025, month: 11 });
  assert.deepEqual(
    summary?.months.map((m) => m.rows.map((r) => r.hourLogId)),
    [[1], [2]],
  );
});

await test('a site filter drops other sites and users left without logs', () => {
  const siteOne = rate({ id: 1, siteId: 1 });
  const siteTwo = rate({ id: 2, siteId: 2 });
  const summaries = buildUserRateSummaries({
    hourLogs: [
      log(siteOne, { id: 1 }),
      log(siteTwo, { id: 2 }),
      log(siteTwo, { id: 3, userId: 'beto' }),
    ],
    users: [ana, beto],
    activeRates: [siteOne, siteTwo],
    period: october,
    siteIds: [1],
  });

  assert.deepEqual(
    summaries.map((s) => s.userId),
    ['ana'],
  );
  assert.deepEqual(
    summaries[0]?.months[1].rows.map((r) => r.siteId),
    [1],
  );
});

await test('a user with logs but missing from the list is still shown', () => {
  const siteRate = rate({ id: 1 });
  const summaries = buildUserRateSummaries({
    hourLogs: [
      log(siteRate, {
        userId: 'admin',
        User: { name: 'Admin', email: 'admin@x.com', image: null },
      }),
    ],
    users: [ana],
    activeRates: [siteRate],
    period: october,
  });

  assert.deepEqual(
    summaries.map((s) => [s.userId, s.name]),
    [
      ['admin', 'Admin'],
      ['ana', 'Ana'],
    ],
  );
});

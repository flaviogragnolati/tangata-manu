import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ARSformatter } from '../../utils/helpers.ts';
import {
  buildUserRateSummaries,
  formatRateChange,
  readLastRateChange,
} from './hourLogRates.ts';

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

/** @type {import('../../types/hours.type.ts').LastRateChange} */
const validChange = {
  kind: 'correction',
  fromSiteRateId: 1,
  toSiteRateId: 1,
  fromAmount: 400000,
  toAmount: 480000,
  byUserId: 'admin',
  byUserName: 'Flavio',
  at: '2026-10-29T15:00:00.000Z',
};

await test('readLastRateChange accepts only a complete lastRateChange', () => {
  assert.equal(readLastRateChange({}), null);
  assert.equal(readLastRateChange(null), null);
  assert.deepEqual(
    readLastRateChange({ lastRateChange: validChange }),
    validChange,
  );
  assert.equal(
    readLastRateChange({ lastRateChange: { ...validChange, kind: 'other' } }),
    null,
  );
  assert.equal(
    readLastRateChange({ lastRateChange: { ...validChange, toAmount: '1' } }),
    null,
  );
});

await test('formatRateChange shows kind, amounts, author and AR date', () => {
  const kinds = {
    correction: 'Corrección de tarifa',
    retroactive: 'Actualización retroactiva',
    removal: 'Baja de tarifa por usuario',
    hourLoad: 'Carga de horas con la tarifa vigente',
  };
  const text = formatRateChange(validChange, kinds);
  const ars = (/** @type {number} */ n) => ARSformatter.format(n);

  assert.equal(
    text,
    `Corrección de tarifa · ${ars(400000)} → ${ars(480000)} · por Flavio el 29/10/2026`,
  );
  // 01:00 UTC on the 30th is still the 29th in Argentina
  assert.match(
    formatRateChange({ ...validChange, at: '2026-10-30T01:00:00.000Z' }, kinds),
    /el 29\/10\/2026$/,
  );
});

await test('summary rows carry the last rate change', () => {
  const siteRate = rate({ id: 1 });
  const [summary] = buildUserRateSummaries({
    hourLogs: [log(siteRate, { metadata: { lastRateChange: validChange } })],
    users: [ana],
    activeRates: [siteRate],
    period: october,
  });

  assert.deepEqual(summary?.months[1].rows[0]?.lastRateChange, validChange);
});

await test('a user dado de baja shows up only with logs, flagged, and never outdated', () => {
  const siteRate = rate({ id: 1 });
  const inactiveUserRate = rate({ id: 2, userId: 'carla', active: false });
  const carla = {
    name: 'Carla',
    email: 'carla@x.com',
    image: null,
    deactivatedAt: new Date('2026-10-15'),
  };
  /** @param {import('./hourLogRates.ts').HourLogLike[]} hourLogs */
  const build = (hourLogs) =>
    buildUserRateSummaries({
      hourLogs,
      users: [ana],
      activeRates: [siteRate],
      period: october,
    });

  assert.deepEqual(
    build([]).map((s) => s.userId),
    ['ana'],
  );

  const summaries = build([
    log(inactiveUserRate, { id: 5, userId: 'carla', User: carla }),
    log(inactiveUserRate, {
      id: 6,
      userId: 'ana',
      User: { ...carla, name: 'Ana', deactivatedAt: null },
    }),
  ]);
  const carlaSummary = summaries.find((s) => s.userId === 'carla');
  assert.equal(carlaSummary?.deactivated, true);
  assert.equal(carlaSummary?.months[1].rows[0]?.isOutdated, false);
  const anaSummary = summaries.find((s) => s.userId === 'ana');
  assert.equal(anaSummary?.deactivated, false);
  assert.equal(anaSummary?.months[1].rows[0]?.isOutdated, true);
});

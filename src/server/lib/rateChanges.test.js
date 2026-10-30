import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  computeAmount,
  planRateChange,
  RateChangeError,
} from './rateChanges.ts';

const now = { year: 2026, month: 9 };

/** @param {Partial<import('./rateChanges.ts').PlanRate>} overrides */
const rate = (overrides) => ({
  id: 1,
  siteId: 1,
  userId: null,
  active: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  normalRate: 1000,
  saturdayPreRate: 0,
  saturdayPostRate: 0,
  ...overrides,
});

/** @param {Partial<import('./rateChanges.ts').PlanLog>} overrides */
const log = (overrides) => ({
  id: 1,
  userId: 'ana',
  year: 2026,
  month: 9,
  siteRateId: 1,
  normalHours: 10,
  saturdayPreHours: null,
  saturdayPostHours: null,
  amount: 10000,
  updatedAt: new Date('2026-10-01'),
  ...overrides,
});

/** @param {number} normalRate */
const values = (normalRate) => ({
  normalRate,
  saturdayPreRate: 0,
  saturdayPostRate: 0,
});

/** @param {() => unknown} fn @param {string} code */
const assertCode = (fn, code) =>
  assert.throws(
    fn,
    (err) => err instanceof RateChangeError && err.code === code,
  );

await test('computeAmount counts null hours and rates as 0', () => {
  assert.equal(
    computeAmount(
      { normalHours: 10, saturdayPreHours: null, saturdayPostHours: 2 },
      { normalRate: 1000, saturdayPreRate: 1500, saturdayPostRate: null },
    ),
    10000,
  );
  assert.equal(
    computeAmount(
      { normalHours: 1, saturdayPreHours: 2, saturdayPostHours: 3 },
      { normalRate: 10, saturdayPreRate: 20, saturdayPostRate: 30 },
    ),
    140,
  );
});

await test('replacing the Tarifa del sitio without retroactive keeps logs and deactivates duplicates', () => {
  const rates = [
    rate({ id: 1 }),
    rate({ id: 2, createdAt: new Date('2026-02-01') }),
    rate({ id: 3, userId: 'ana', normalRate: 1200 }),
    rate({ id: 4, active: false }),
  ];
  const logs = [
    log({ id: 10, siteRateId: 1 }),
    log({ id: 11, siteRateId: 2, userId: 'beto' }),
    log({ id: 12, siteRateId: 3 }),
  ];
  const plan = planRateChange({
    change: {
      kind: 'replace',
      siteId: 1,
      userId: null,
      values: values(2000),
      retroactiveFrom: null,
    },
    rates,
    logs,
    now,
  });

  assert.deepEqual(plan.deactivateRateIds, [1, 2]);
  assert.deepEqual(plan.createRate, {
    siteId: 1,
    userId: null,
    values: values(2000),
    replacedRateId: 2,
  });
  assert.equal(plan.targetRateId, 'new');
  assert.deepEqual(plan.items, []);
  assert.equal(plan.keptOnPreviousRate, 2);
  assert.equal(plan.totals.logs, 0);
});

await test('a retroactive Tarifa del sitio skips user-rate logs and takes old site-rate logs from the period on', () => {
  const rates = [
    rate({ id: 1, active: false }),
    rate({ id: 2 }),
    rate({ id: 3, userId: 'ana', normalRate: 1200 }),
  ];
  const logs = [
    log({ id: 10, siteRateId: 1, userId: 'beto', month: 8 }),
    log({ id: 11, siteRateId: 2, userId: 'beto', month: 9 }),
    log({ id: 12, siteRateId: 3, userId: 'ana', month: 9, amount: 12000 }),
    log({ id: 13, siteRateId: 2, userId: 'carla', month: 7 }),
  ];
  const plan = planRateChange({
    change: {
      kind: 'replace',
      siteId: 1,
      userId: null,
      values: values(2000),
      retroactiveFrom: { year: 2026, month: 8 },
    },
    rates,
    logs,
    now,
  });

  assert.deepEqual(
    plan.items.map((item) => item.hourLogId),
    [10, 11],
  );
  assert.deepEqual(
    plan.items.map((item) => [item.fromAmount, item.toAmount]),
    [
      [10000, 20000],
      [10000, 20000],
    ],
  );
  assert.equal(plan.totals.users, 1);
  assert.deepEqual(plan.totals.from, { year: 2026, month: 8 });
  assert.deepEqual(plan.totals.to, { year: 2026, month: 9 });
  assert.equal(plan.totals.fromAmount, 20000);
  assert.equal(plan.totals.toAmount, 40000);
  assert.equal(plan.totals.touchesPastPeriods, true);
  // log 13 is before the period and stays on the replaced rate
  assert.equal(plan.keptOnPreviousRate, 1);
});

await test('a retroactive Tarifa por usuario takes that user’s logs, including site-rate ones', () => {
  const rates = [
    rate({ id: 1 }),
    rate({ id: 2, userId: 'ana', normalRate: 1200 }),
  ];
  const logs = [
    log({ id: 10, siteRateId: 1, userId: 'ana', month: 9 }),
    log({ id: 11, siteRateId: 2, userId: 'ana', month: 9 }),
    log({ id: 12, siteRateId: 1, userId: 'beto', month: 9 }),
  ];
  const plan = planRateChange({
    change: {
      kind: 'replace',
      siteId: 1,
      userId: 'ana',
      values: values(1500),
      retroactiveFrom: now,
    },
    rates,
    logs,
    now,
  });

  assert.deepEqual(plan.deactivateRateIds, [2]);
  assert.deepEqual(
    plan.items.map((item) => [item.hourLogId, item.toAmount]),
    [
      [10, 15000],
      [11, 15000],
    ],
  );
  assert.equal(plan.totals.touchesPastPeriods, false);
});

await test('correcting an inactive rate recalculates only logs whose amount changes', () => {
  const rates = [rate({ id: 1, active: false }), rate({ id: 2 })];
  const logs = [
    log({ id: 10, siteRateId: 1 }),
    log({ id: 11, siteRateId: 1, normalHours: 0, amount: 0 }),
    log({ id: 12, siteRateId: 2 }),
  ];
  const plan = planRateChange({
    change: { kind: 'correct', siteRateId: 1, values: values(1100) },
    rates,
    logs,
    now,
  });

  assert.deepEqual(plan.updateRate, { id: 1, values: values(1100) });
  assert.equal(plan.targetRateId, 1);
  assert.deepEqual(plan.deactivateRateIds, []);
  assert.deepEqual(
    plan.items.map((item) => [item.hourLogId, item.toAmount]),
    [[10, 11000]],
  );
});

await test('a correction with the current values is rejected', () => {
  assertCode(
    () =>
      planRateChange({
        change: { kind: 'correct', siteRateId: 1, values: values(1000) },
        rates: [rate({ id: 1, saturdayPreRate: null })],
        logs: [],
        now,
      }),
    'NO_CHANGES',
  );
  assertCode(
    () =>
      planRateChange({
        change: { kind: 'correct', siteRateId: 9, values: values(1) },
        rates: [rate({ id: 1 })],
        logs: [],
        now,
      }),
    'RATE_NOT_FOUND',
  );
});

await test('removing a Tarifa por usuario moves user-rate logs to the newest Tarifa del sitio', () => {
  const rates = [
    rate({ id: 1, createdAt: new Date('2026-01-01') }),
    rate({ id: 2, createdAt: new Date('2026-03-01'), normalRate: 900 }),
    rate({ id: 3, userId: 'ana', normalRate: 1200, active: false }),
    rate({ id: 4, userId: 'ana', normalRate: 1300 }),
  ];
  const logs = [
    log({ id: 10, siteRateId: 3, month: 8, amount: 12000 }),
    log({ id: 11, siteRateId: 4, month: 9, amount: 13000 }),
    log({ id: 12, siteRateId: 2, month: 9, amount: 9000 }),
    log({ id: 13, siteRateId: 4, userId: 'ana', month: 7, amount: 13000 }),
  ];
  /** @param {{ year: number; month: number } | null} retroactiveFrom */
  const change = (retroactiveFrom) => ({
    kind: /** @type {const} */ ('removeUserRate'),
    siteRateId: 4,
    retroactiveFrom,
  });

  const withPeriod = planRateChange({
    change: change({ year: 2026, month: 8 }),
    rates,
    logs,
    now,
  });
  assert.deepEqual(withPeriod.deactivateRateIds, [4]);
  assert.equal(withPeriod.targetRateId, 2);
  assert.deepEqual(
    withPeriod.items.map((item) => [item.hourLogId, item.toAmount]),
    [
      [10, 9000],
      [11, 9000],
    ],
  );
  assert.equal(withPeriod.keptOnPreviousRate, 1);

  const withoutPeriod = planRateChange({
    change: change(null),
    rates,
    logs,
    now,
  });
  assert.deepEqual(withoutPeriod.items, []);
  assert.equal(withoutPeriod.keptOnPreviousRate, 2);
});

await test('removing a rate requires an active Tarifa por usuario and a Tarifa del sitio', () => {
  const base = { logs: [], now };
  const remove = {
    kind: /** @type {const} */ ('removeUserRate'),
    retroactiveFrom: null,
  };
  assertCode(
    () =>
      planRateChange({
        ...base,
        change: { ...remove, siteRateId: 1 },
        rates: [rate({ id: 1, userId: 'ana' })],
      }),
    'NO_SITE_RATE',
  );
  assertCode(
    () =>
      planRateChange({
        ...base,
        change: { ...remove, siteRateId: 1 },
        rates: [rate({ id: 1 })],
      }),
    'NOT_USER_RATE',
  );
  assertCode(
    () =>
      planRateChange({
        ...base,
        change: { ...remove, siteRateId: 2 },
        rates: [rate({ id: 1 }), rate({ id: 2, userId: 'ana', active: false })],
      }),
    'NOT_ACTIVE',
  );
});

await test('a retroactive period in the future is rejected', () => {
  assertCode(
    () =>
      planRateChange({
        change: {
          kind: 'replace',
          siteId: 1,
          userId: null,
          values: values(1),
          retroactiveFrom: { year: 2026, month: 10 },
        },
        rates: [],
        logs: [],
        now,
      }),
    'FUTURE_PERIOD',
  );
});

await test('the period comparison crosses the year boundary', () => {
  const logs = [
    log({ id: 10, year: 2025, month: 10 }),
    log({ id: 11, year: 2025, month: 11 }),
    log({ id: 12, year: 2026, month: 0 }),
  ];
  const plan = planRateChange({
    change: {
      kind: 'replace',
      siteId: 1,
      userId: null,
      values: values(2000),
      retroactiveFrom: { year: 2025, month: 11 },
    },
    rates: [rate({ id: 1 })],
    logs,
    now,
  });

  assert.deepEqual(
    plan.items.map((item) => item.hourLogId),
    [11, 12],
  );
});

await test('the fingerprint ignores input order and changes when a log changes', () => {
  const rates = [rate({ id: 1 }), rate({ id: 2, userId: 'ana' })];
  const first = log({ id: 10 });
  const second = log({ id: 11, userId: 'beto' });
  const logs = [first, second];
  const change = {
    kind: /** @type {const} */ ('replace'),
    siteId: 1,
    userId: null,
    values: values(2000),
    retroactiveFrom: now,
  };

  const a = planRateChange({ change, rates, logs, now });
  const b = planRateChange({
    change,
    rates: [...rates].reverse(),
    logs: [...logs].reverse(),
    now,
  });
  const c = planRateChange({
    change,
    rates,
    logs: [first, { ...second, updatedAt: new Date('2026-10-02') }],
    now,
  });

  assert.equal(a.fingerprint, b.fingerprint);
  assert.notEqual(a.fingerprint, c.fingerprint);
});

await test('a replace records the newest active rate of its scope as replaced', () => {
  /** @param {import('./rateChanges.ts').PlanRate[]} rates @param {string | null} userId */
  const replacedRateId = (rates, userId) =>
    planRateChange({
      change: {
        kind: 'replace',
        siteId: 1,
        userId,
        values: values(2000),
        retroactiveFrom: null,
      },
      rates,
      logs: [],
      now,
    }).createRate?.replacedRateId;

  assert.equal(
    replacedRateId([rate({ id: 1 }), rate({ id: 2, userId: 'ana' })], null),
    1,
  );
  assert.equal(
    replacedRateId([rate({ id: 1 }), rate({ id: 2, active: false })], 'ana'),
    null,
  );
  assert.equal(
    replacedRateId(
      [
        rate({ id: 1, createdAt: new Date('2026-03-01') }),
        rate({ id: 2, createdAt: new Date('2026-02-01') }),
      ],
      null,
    ),
    1,
  );
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { planUserHourLog } from './userHourLogPlan.ts';

/** @param {Partial<import('../../client/lib/siteRates.ts').RateLike>} overrides */
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

/** @param {Partial<import('./userHourLogPlan.ts').PreviousLog>} overrides */
const previousLog = (overrides) => ({
  id: 50,
  siteId: 1,
  siteRateId: 1,
  normalHours: 10,
  saturdayPreHours: null,
  saturdayPostHours: null,
  amount: 10000,
  metadata: {},
  ...overrides,
});

const sites = [
  { id: 1, name: 'Centro' },
  { id: 2, name: 'Norte' },
];

await test('a new load in two sites creates one log per site', () => {
  const plan = planUserHourLog({
    entries: [
      { site: 1, rate: 'normal', hours: 8 },
      { site: 2, rate: 'saturdayPre', hours: 2 },
    ],
    activeRates: [rate({ id: 1 }), rate({ id: 2, siteId: 2 })],
    previousLogs: [],
    sites,
    userId: 'ana',
  });

  assert.deepEqual(plan.toUpdate, []);
  assert.deepEqual(plan.toCreate, [
    {
      siteRateId: 1,
      normalHours: 8,
      saturdayPreHours: 0,
      saturdayPostHours: 0,
      amount: 8000,
    },
    {
      siteRateId: 2,
      normalHours: 0,
      saturdayPreHours: 2,
      saturdayPostHours: 0,
      amount: 3000,
    },
  ]);
  assert.deepEqual(
    plan.perSite.map((site) => [site.siteName, site.amount, site.rateChanged]),
    [
      ['Centro', 8000, false],
      ['Norte', 3000, false],
    ],
  );
});

await test('merging with a log on the same rate adds hours without a rate change', () => {
  const plan = planUserHourLog({
    entries: [{ site: 1, rate: 'normal', hours: 5 }],
    activeRates: [rate({ id: 1 })],
    previousLogs: [previousLog({ metadata: { note: 'x' } })],
    sites,
    userId: 'ana',
  });

  assert.deepEqual(plan.toCreate, []);
  assert.deepEqual(plan.toUpdate, [
    {
      id: 50,
      data: {
        siteRateId: 1,
        normalHours: 15,
        saturdayPreHours: 0,
        saturdayPostHours: 0,
        amount: 15000,
      },
      metadata: { note: 'x' },
      rateChange: null,
    },
  ]);
  assert.equal(plan.perSite[0]?.previousHours, 10);
  assert.equal(plan.perSite[0]?.totalHours, 15);
});

await test('merging with a log on an old rate prices the whole log with the applicable rate', () => {
  const plan = planUserHourLog({
    entries: [{ site: 1, rate: 'normal', hours: 5 }],
    activeRates: [rate({ id: 2, normalRate: 1200 })],
    previousLogs: [previousLog({ siteRateId: 1, amount: 10000 })],
    sites,
    userId: 'ana',
  });

  const [update] = plan.toUpdate;
  assert.equal(update?.data.siteRateId, 2);
  assert.equal(update?.data.amount, 18000);
  assert.deepEqual(update?.rateChange, {
    fromSiteRateId: 1,
    toSiteRateId: 2,
    fromAmount: 10000,
    toAmount: 18000,
  });
  assert.equal(plan.perSite[0]?.rateChanged, true);
});

await test('a site without a Tarifa vigente is reported and not written', () => {
  const plan = planUserHourLog({
    entries: [{ site: 2, rate: 'normal', hours: 5 }],
    activeRates: [rate({ id: 1 })],
    previousLogs: [],
    sites,
    userId: 'ana',
  });

  assert.deepEqual(plan.toCreate, []);
  assert.equal(plan.perSite[0]?.missingRate, true);
  assert.equal(plan.perSite[0]?.amount, null);
  assert.equal(plan.perSite[0]?.rate, null);
});

await test('the user’s Tarifa por usuario wins over the Tarifa del sitio', () => {
  const plan = planUserHourLog({
    entries: [{ site: 1, rate: 'normal', hours: 1 }],
    activeRates: [
      rate({ id: 1 }),
      rate({ id: 2, userId: 'ana', normalRate: 1300 }),
      rate({ id: 3, userId: 'beto', normalRate: 900 }),
    ],
    previousLogs: [],
    sites,
    userId: 'ana',
  });

  assert.equal(plan.toCreate[0]?.siteRateId, 2);
  assert.equal(plan.toCreate[0]?.amount, 1300);
});

await test('two entries of the same site and hour type add up', () => {
  const plan = planUserHourLog({
    entries: [
      { site: 1, rate: 'saturdayPost', hours: 2 },
      { site: 1, rate: 'saturdayPost', hours: 1.5 },
    ],
    activeRates: [rate({ id: 1 })],
    previousLogs: [],
    sites,
    userId: 'ana',
  });

  assert.equal(plan.toCreate.length, 1);
  assert.equal(plan.toCreate[0]?.saturdayPostHours, 3.5);
  assert.equal(plan.toCreate[0]?.amount, 7000);
});

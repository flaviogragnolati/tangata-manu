import assert from 'node:assert/strict';
import { test } from 'node:test';

import { amountDeltas, latestRateByUserSite, pctChange } from './salaries.ts';

/**
 * @param {string} userId
 * @param {string} siteId
 * @param {number} year
 * @param {number} month
 * @param {number} totalAmount
 */
const salary = (userId, siteId, year, month, totalAmount) => ({
  userId,
  siteId,
  year,
  month,
  totalAmount,
});

await test('pctChange rounds to whole percents', () => {
  assert.equal(pctChange(1100, 1000), 10);
  assert.equal(pctChange(950, 1000), -5);
  assert.equal(pctChange(1000, 3000), -67);
});

await test('pctChange has no value without a previous amount', () => {
  assert.equal(pctChange(500, 0), null);
});

await test('amountDeltas compares each user with the previous month', () => {
  const deltas = amountDeltas(
    [
      salary('ana', '1', 2026, 9, 1100),
      salary('ana', '1', 2026, 8, 1000),
      salary('beto', '1', 2026, 9, 950),
      salary('beto', '1', 2026, 8, 1000),
      salary('caro', '1', 2026, 9, 300),
      salary('ana', '1', 2026, 7, 99999),
    ],
    'userId',
    { year: 2026, month: 9 },
  );

  assert.deepEqual(deltas.byKey, { ana: 10, beto: -5, caro: null });
  assert.equal(deltas.total, 18);
});

await test('amountDeltas compares January with December of the previous year', () => {
  const deltas = amountDeltas(
    [salary('ana', '1', 2026, 0, 1200), salary('ana', '1', 2025, 11, 1000)],
    'userId',
    { year: 2026, month: 0 },
  );

  assert.deepEqual(deltas.byKey, { ana: 20 });
  assert.equal(deltas.total, 20);
});

await test('amountDeltas can group by site', () => {
  const deltas = amountDeltas(
    [
      salary('ana', '1', 2026, 9, 600),
      salary('beto', '1', 2026, 9, 600),
      salary('ana', '1', 2026, 8, 1000),
      salary('ana', '2', 2026, 9, 500),
    ],
    'siteId',
    { year: 2026, month: 9 },
  );

  assert.deepEqual(deltas.byKey, { 1: 20, 2: null });
  assert.equal(deltas.total, 70);
});

/** @param {number} siteId @param {number} normalRate */
const siteRate = (siteId, normalRate) => ({
  siteId,
  normalRate,
  saturdayPreRate: null,
  saturdayPostRate: 0,
});

await test('latestRateByUserSite keeps the newest log’s applied rate per user and site', () => {
  const latest = latestRateByUserSite([
    { userId: 'ana', year: 2026, month: 2, SiteRate: siteRate(1, 2000) },
    { userId: 'ana', year: 2026, month: 1, SiteRate: siteRate(1, 1000) },
    { userId: 'ana', year: 2025, month: 11, SiteRate: siteRate(2, 500) },
  ]);
  assert.deepEqual(latest.get('ana:1'), {
    normalRate: 2000,
    saturdayPreRate: 0,
    saturdayPostRate: 0,
  });
  assert.equal(latest.get('ana:2')?.normalRate, 500);
  assert.equal(latest.size, 2);
});

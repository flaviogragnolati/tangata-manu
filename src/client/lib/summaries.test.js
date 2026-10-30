import assert from 'node:assert/strict';
import { test } from 'node:test';

import { summarizeSalaries, summarizeUserPeriod } from './summaries.ts';

await test('summarizeSalaries counts a user with two sites once', () => {
  const summary = summarizeSalaries([
    { userId: 'ana', totalHours: 10, totalAmount: 1000 },
    { userId: 'ana', totalHours: 5, totalAmount: 750 },
    { userId: 'beto', totalHours: 2, totalAmount: 200 },
  ]);

  assert.deepEqual(summary, {
    totalHours: 17,
    totalAmount: 1950,
    usersCount: 2,
  });
});

await test('summarizeSalaries is all zeros without salaries', () => {
  assert.deepEqual(summarizeSalaries([]), {
    totalHours: 0,
    totalAmount: 0,
    usersCount: 0,
  });
});

/** @param {Partial<import('~/server/lib/controller/hour.controller').NormalizedHourLogContent>} overrides */
const siteLog = (overrides) => ({
  userHourLogId: 1,
  siteName: 'Centro',
  normalHours: 0,
  saturdayPreHours: 0,
  saturdayPostHours: 0,
  normalAmount: 0,
  saturdayPreAmount: 0,
  saturdayPostAmount: 0,
  ...overrides,
});

await test('summarizeUserPeriod adds every hour type of the period', () => {
  const hours = {
    2026: {
      9: {
        1: siteLog({ normalHours: 10, normalAmount: 1000 }),
        2: siteLog({
          normalHours: 2,
          saturdayPreHours: 3,
          saturdayPostHours: 1,
          normalAmount: 200,
          saturdayPreAmount: 450,
          saturdayPostAmount: 200,
        }),
      },
      8: { 1: siteLog({ normalHours: 99, normalAmount: 9900 }) },
    },
  };

  assert.deepEqual(summarizeUserPeriod(hours, { year: 2026, month: 9 }), {
    totalHours: 16,
    totalAmount: 1850,
    sitesCount: 2,
  });
});

await test('summarizeUserPeriod is all zeros for a period without data', () => {
  assert.deepEqual(summarizeUserPeriod({}, { year: 2026, month: 9 }), {
    totalHours: 0,
    totalAmount: 0,
    sitesCount: 0,
  });
});

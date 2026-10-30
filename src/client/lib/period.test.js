import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  comparePeriods,
  currentPeriod,
  formatPeriod,
  isSamePeriod,
  nextPeriod,
  previousPeriod,
} from './period.ts';

await test('nextPeriod rolls December into January of the next year', () => {
  assert.deepEqual(nextPeriod({ year: 2025, month: 11 }), {
    year: 2026,
    month: 0,
  });
  assert.deepEqual(nextPeriod({ year: 2026, month: 3 }), {
    year: 2026,
    month: 4,
  });
});

await test('previousPeriod rolls January back to December of the previous year', () => {
  assert.deepEqual(previousPeriod({ year: 2026, month: 0 }), {
    year: 2025,
    month: 11,
  });
  assert.deepEqual(previousPeriod({ year: 2026, month: 5 }), {
    year: 2026,
    month: 4,
  });
});

await test('currentPeriod reads the month in Argentina, not UTC', () => {
  const instant = new Date('2026-11-01T01:00:00Z');

  assert.deepEqual(currentPeriod(instant), { year: 2026, month: 9 });
  assert.deepEqual(currentPeriod(instant, 'UTC'), { year: 2026, month: 10 });
});

await test('comparePeriods orders by year, then month', () => {
  const periods = [
    { year: 2026, month: 2 },
    { year: 2025, month: 11 },
    { year: 2026, month: 0 },
  ];

  assert.deepEqual(periods.sort(comparePeriods), [
    { year: 2025, month: 11 },
    { year: 2026, month: 0 },
    { year: 2026, month: 2 },
  ]);
  assert.ok(isSamePeriod({ year: 2026, month: 4 }, { year: 2026, month: 4 }));
  assert.ok(!isSamePeriod({ year: 2026, month: 4 }, { year: 2025, month: 4 }));
});

await test('formatPeriod uses the given month names', () => {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  assert.equal(formatPeriod({ year: 2026, month: 9 }, months), 'Octubre 2026');
});

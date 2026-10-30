import assert from 'node:assert/strict';
import { test } from 'node:test';

import { latestPeriodByUser } from './users.ts';

await test('latestPeriodByUser compares month within a year and year across years', () => {
  const latest = latestPeriodByUser([
    { userId: 'ana', year: 2026, month: 0 },
    { userId: 'ana', year: 2026, month: 11 },
    { userId: 'beto', year: 2026, month: 11 },
    { userId: 'beto', year: 2027, month: 0 },
  ]);
  assert.deepEqual(latest.get('ana'), { year: 2026, month: 11 });
  assert.deepEqual(latest.get('beto'), { year: 2027, month: 0 });
  assert.equal(latest.get('carla'), undefined);
});

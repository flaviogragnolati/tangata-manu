import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filterUsers, latestPeriodByUser } from './users.ts';

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

const users = [
  { name: 'Médica Ana', email: 'ana@x.com', deactivatedAt: null },
  { name: null, email: 'beto@x.com', deactivatedAt: '2026-10-01T00:00:00Z' },
];

await test('filterUsers matches without accents and by email', () => {
  /** @param {string} query */
  const names = (query) =>
    filterUsers(users, { query, status: 'all' }).map((u) => u.email);
  assert.deepEqual(names('medica'), ['ana@x.com']);
  assert.deepEqual(names(' BETO '), ['beto@x.com']);
  assert.deepEqual(names(''), ['ana@x.com', 'beto@x.com']);
});

await test('filterUsers filters by status', () => {
  /** @param {import('./users.ts').UserStatusFilter} status */
  const emails = (status) =>
    filterUsers(users, { query: '', status }).map((u) => u.email);
  assert.deepEqual(emails('active'), ['ana@x.com']);
  assert.deepEqual(emails('deactivated'), ['beto@x.com']);
});

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { planRateDeletion, RateDeletionError } from './rateDeletion.ts';

const created = new Date('2026-03-01T12:00:00Z');
/** @param {number} ms */
const at = (ms) => new Date(created.getTime() + ms);

/** @param {Partial<import('./rateDeletion.ts').DeletionRate>} overrides */
const rate = (overrides) => ({
  id: 1,
  siteId: 1,
  userId: null,
  active: true,
  replacedRateId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  normalRate: 1000,
  saturdayPreRate: 0,
  saturdayPostRate: 0,
  ...overrides,
});

/** @param {import('./rateDeletion.ts').DeletionRate[]} rates */
const plan = (rates, siteRateId = 2, logsCount = 0) =>
  planRateDeletion({ siteRateId, rates, logsCount });

/** @param {() => unknown} fn @param {string} code */
const assertCode = (fn, code) =>
  assert.throws(
    fn,
    (err) => err instanceof RateDeletionError && err.code === code,
  );

await test('deleting an inactive rate changes no vigente rate', () => {
  assert.deepEqual(plan([rate({ id: 1 }), rate({ id: 2, active: false })]), {
    rateId: 2,
    outcome: 'inactive',
    restoreRateId: null,
  });
});

await test('deleting a vigente rate restores the one it replaced', () => {
  const rates = [
    rate({ id: 1, active: false, updatedAt: new Date('2026-06-01') }),
    rate({ id: 2, replacedRateId: 1, createdAt: created }),
  ];
  assert.deepEqual(plan(rates), {
    rateId: 2,
    outcome: 'restores',
    restoreRateId: 1,
  });
});

await test('a duplicate vigente rate of the same scope stays and nothing is restored', () => {
  const rates = [
    rate({ id: 1 }),
    rate({ id: 2, replacedRateId: 3, createdAt: created }),
    rate({ id: 3, active: false }),
  ];
  assert.equal(plan(rates).outcome, 'otherActiveRemains');
  assert.equal(plan(rates).restoreRateId, null);
});

await test('a vigente rate that replaced nothing leaves the scope empty', () => {
  assert.equal(
    plan([rate({ id: 2, userId: 'ana', createdAt: created })]).outcome,
    'leavesScopeEmpty',
  );
});

await test('an old rate without replacedRateId restores the rate deactivated right after its creation', () => {
  const rates = [
    rate({ id: 1, active: false, updatedAt: at(50) }),
    rate({ id: 2, createdAt: created }),
  ];
  assert.deepEqual(plan(rates), {
    rateId: 2,
    outcome: 'restores',
    restoreRateId: 1,
  });
});

await test('an old rate whose predecessor was deactivated an hour earlier leaves the scope empty', () => {
  const rates = [
    rate({ id: 1, active: false, updatedAt: at(-3_600_000) }),
    rate({ id: 2, createdAt: created }),
  ];
  assert.equal(plan(rates).outcome, 'leavesScopeEmpty');
});

await test('the heuristic picks the newest candidate inside the window and accepts string dates', () => {
  // Dates serialized as strings, as they may reach the client
  /** @param {Record<string, unknown>} overrides */
  const serialized = (overrides) => rate(/** @type {any} */ (overrides));
  const rates = [
    serialized({
      id: 1,
      active: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: at(10).toISOString(),
    }),
    serialized({
      id: 3,
      active: false,
      createdAt: '2026-02-01T00:00:00Z',
      updatedAt: at(20).toISOString(),
    }),
    serialized({ id: 2, createdAt: created.toISOString() }),
  ];
  assert.equal(plan(rates).restoreRateId, 3);
});

await test('a user rate never restores a site rate, nor the other way round', () => {
  assert.equal(
    plan([
      rate({ id: 1, active: false, updatedAt: at(10) }),
      rate({ id: 2, userId: 'ana', replacedRateId: 1, createdAt: created }),
    ]).outcome,
    'leavesScopeEmpty',
  );
  assert.equal(
    plan([
      rate({ id: 1, userId: 'ana', active: false, updatedAt: at(10) }),
      rate({ id: 2, replacedRateId: 1, createdAt: created }),
    ]).outcome,
    'leavesScopeEmpty',
  );
  // userId may come undefined instead of null
  assert.equal(
    plan([
      rate({ id: 1, userId: undefined, active: false, updatedAt: at(10) }),
      rate({ id: 2, createdAt: created }),
    ]).restoreRateId,
    1,
  );
});

await test('a replacedRateId pointing to an active rate of another scope is not used', () => {
  const rates = [
    rate({ id: 1, userId: 'ana' }),
    rate({ id: 2, userId: 'beto', replacedRateId: 1, createdAt: created }),
  ];
  assert.equal(plan(rates).outcome, 'leavesScopeEmpty');
});

await test('a rate with hour logs or a missing rate cannot be deleted', () => {
  assertCode(() => plan([rate({ id: 2 })], 2, 3), 'HAS_LOGS');
  assertCode(() => plan([rate({ id: 1 })], 2), 'RATE_NOT_FOUND');
});

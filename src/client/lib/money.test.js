import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMoneyInput, parseMoney, percentChange } from './money.ts';

await test('parseMoney reads es-AR thousands and decimals', () => {
  assert.equal(parseMoney('12.500'), 12500);
  assert.equal(parseMoney('12500,5'), 12500.5);
  assert.equal(parseMoney('$ 1.234.567,25'), 1234567.25);
  assert.equal(parseMoney('800'), 800);
});

await test('parseMoney keeps empty as null and rejects other text', () => {
  assert.equal(parseMoney(''), null);
  assert.equal(parseMoney('  '), null);
  assert.ok(Number.isNaN(parseMoney('12a')));
  assert.ok(Number.isNaN(parseMoney('1,2,3')));
});

await test('formatMoneyInput round-trips through parseMoney', () => {
  for (const value of [0, 800, 12500, 12500.5, 1234567.25]) {
    assert.equal(parseMoney(formatMoneyInput(value)), value);
  }
  assert.equal(formatMoneyInput(null), '');
  assert.equal(formatMoneyInput(NaN), '');
});

await test('percentChange rounds and ignores a zero base', () => {
  assert.equal(percentChange(12000, 10000), 20);
  assert.equal(percentChange(9500, 10000), -5);
  assert.equal(percentChange(100, 0), null);
});

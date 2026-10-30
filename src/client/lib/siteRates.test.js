import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sitesWithoutSiteRate } from './siteRates.ts';

await test('sitesWithoutSiteRate ignores Tarifas por usuario', () => {
  const sites = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const rates = [
    { siteId: 1, userId: null, active: true },
    { siteId: 2, userId: 'ana', active: true },
    { siteId: 3, userId: null, active: false },
  ];

  assert.deepEqual(sitesWithoutSiteRate(sites, rates), [{ id: 2 }, { id: 3 }]);
});

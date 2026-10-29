import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const envModuleUrl = new URL('./env.js', import.meta.url).href;

const requiredVars = {
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/tangata-manu',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_CLIENT_SECRET: 'client-secret',
};

const vercelVars = {
  VERCEL: '1',
  VERCEL_URL: 'tangata-manu-git-main.vercel.app',
};

/**
 * env.js validates on import, so each case imports it in a fresh process with no inherited env.
 *
 * @param {Record<string, string>} vars
 */
function loadEnv(vars) {
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `await import(${JSON.stringify(envModuleUrl)})`,
    ],
    { encoding: 'utf8', env: { NODE_ENV: 'test', ...requiredVars, ...vars } },
  );
}

await test('rejects a NEXTAUTH_URL without an http(s) scheme on Vercel', () => {
  for (const NEXTAUTH_URL of ['1', 'localhost:3000']) {
    const { status, stderr } = loadEnv({ ...vercelVars, NEXTAUTH_URL });

    assert.notEqual(status, 0, NEXTAUTH_URL);
    assert.match(stderr, /NEXTAUTH_URL/);
  }
});

await test('accepts a full NEXTAUTH_URL on Vercel', () => {
  const { status } = loadEnv({
    ...vercelVars,
    NEXTAUTH_URL: 'https://tangata-manu.vercel.app',
  });

  assert.equal(status, 0);
});

await test('allows omitting NEXTAUTH_URL on Vercel', () => {
  assert.equal(loadEnv(vercelVars).status, 0);
});

await test('requires NEXTAUTH_URL outside Vercel', () => {
  const { status, stderr } = loadEnv({});

  assert.notEqual(status, 0);
  assert.match(stderr, /NEXTAUTH_URL/);
});

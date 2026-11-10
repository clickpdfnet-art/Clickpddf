import assert from 'node:assert/strict';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const runnerSource = await readFile(path.join(scriptDir, 'run-clickpdf-build.mjs'), 'utf8');
const approvedSitemapIndexSha256 = '82a73902c844ea1162dbfeb84e263dd7afb973de9c8f59aed08a4c767bbcb2e7';
const protectedNames = ['sitemap.xml', 'llms.txt', 'llms-full.txt'];
const protectedSourceBytes = Object.fromEntries(
  await Promise.all(
    protectedNames.map(async (name) => [
      name,
      await readFile(path.join(appDir, 'public', name)),
    ]),
  ),
);
const sitemapIndexBytes = await readFile(
  path.join(appDir, 'dist', 'public', 'sitemap_index.xml'),
);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

assert.equal(
  sha256(sitemapIndexBytes),
  approvedSitemapIndexSha256,
  'the isolated fixtures must start from the approved sitemap-index bytes',
);

const preserveTestFiles = [
  'test-tools-index-route.mjs',
  'test-cloudflare-tool-routes.mjs',
  'test-tool-visibility.mjs',
  'test-sitemap-counts.mjs',
  'test-structured-data.mjs',
  'test-sitemap-index.mjs',
  'test-tool-privacy-copy.mjs',
  'test-tool-seo-audit.mjs',
  'test-localized-tool-seo.mjs',
  'test-additional-tool-engines.mjs',
  'test-adsense-integration.mjs',
  'test-sitemap-preserve-mode.mjs',
  'test-merge-pdf-regression.mjs',
  'test-pdf-background-regression.mjs',
];

const markerScript = `
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
await writeFile(
  path.join(process.env.CLICKPDF_GUARD_MARKERS, ${JSON.stringify('SCRIPT_MARKER')}),
  process.cwd(),
);
`;

const viteStub = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const app = process.cwd();
const publicDir = path.join(app, 'public');
const distPublicDir = path.join(app, 'dist', 'public');
const indexPath = path.join(distPublicDir, 'sitemap_index.xml');
const scenario = process.env.CLICKPDF_GUARD_SCENARIO;
fs.mkdirSync(distPublicDir, { recursive: true });
fs.writeFileSync(path.join(process.env.CLICKPDF_GUARD_MARKERS, 'vite'), app);
for (const name of ['sitemap.xml', 'llms.txt', 'llms-full.txt']) {
  fs.copyFileSync(path.join(publicDir, name), path.join(distPublicDir, name));
}
if (scenario === 'build-failure-changed') {
  fs.writeFileSync(indexPath, 'changed-by-stub-build');
  process.exit(23);
}
`;

const structuredGeneratorStub = `
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
await writeFile(
  path.join(process.env.CLICKPDF_GUARD_MARKERS, 'structured-data'),
  process.cwd(),
);
`;

const sitemapIndexGeneratorStub = `
import { appendFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
const app = process.cwd();
const marker = path.join(process.env.CLICKPDF_GUARD_MARKERS, 'sitemap-index');
const indexPath = path.join(app, 'dist', 'public', 'sitemap_index.xml');
await writeFile(marker, app);
if (process.env.CLICKPDF_GUARD_SCENARIO === 'after-build-changed') {
  await writeFile(indexPath, 'changed-by-stub-index-generator');
} else if (process.env.CLICKPDF_GUARD_SCENARIO === 'build-failure-changed') {
  await appendFile(marker, '\\n');
}
`;

function testStub(name) {
  const markerName = `test-${name}`;
  const base = markerScript.replace('SCRIPT_MARKER', markerName);
  if (name !== 'test-sitemap-preserve-mode.mjs') return base;
  return `${base}
import { rm, writeFile as writeIndexFile } from 'node:fs/promises';
const indexPath = path.join(process.cwd(), 'dist', 'public', 'sitemap_index.xml');
const scenario = process.env.CLICKPDF_GUARD_SCENARIO;
if (scenario === 'after-tests-changed') {
  await writeIndexFile(indexPath, 'changed-by-stub-tests');
} else if (scenario === 'test-failure-missing') {
  await rm(indexPath, { force: true });
  throw new Error('SIMULATED_TEST_COMMAND_FAILURE');
}
`;
}

async function createFixture(t, { scenario = 'success', indexState = 'approved' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-sitemap-index-guard-'));
  t.after(() => rm(root, { recursive: true, force: true }));

  const fixtureApp = path.join(root, 'app');
  const scriptsDir = path.join(fixtureApp, 'scripts');
  const publicDir = path.join(fixtureApp, 'public');
  const distPublicDir = path.join(fixtureApp, 'dist', 'public');
  const dataDir = path.join(fixtureApp, 'src', 'data');
  const blogsDir = path.join(fixtureApp, 'src', 'blogs');
  const binDir = path.join(root, 'bin');
  const markerDir = path.join(root, 'markers');
  const indexPath = path.join(distPublicDir, 'sitemap_index.xml');

  await Promise.all([
    mkdir(scriptsDir, { recursive: true }),
    mkdir(publicDir, { recursive: true }),
    mkdir(distPublicDir, { recursive: true }),
    mkdir(dataDir, { recursive: true }),
    mkdir(blogsDir, { recursive: true }),
    mkdir(binDir, { recursive: true }),
    mkdir(markerDir, { recursive: true }),
  ]);

  await writeFile(path.join(scriptsDir, 'run-clickpdf-build.mjs'), runnerSource);
  for (const name of protectedNames) {
    await writeFile(path.join(publicDir, name), protectedSourceBytes[name]);
    await writeFile(path.join(distPublicDir, name), protectedSourceBytes[name]);
  }

  await writeFile(
    path.join(dataDir, 'blogWatermarkMap.json'),
    JSON.stringify({
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80':
        '/watermark.png',
    }),
  );
  await writeFile(path.join(publicDir, 'watermark.png'), 'isolated watermark fixture');

  if (indexState === 'approved') {
    await writeFile(indexPath, sitemapIndexBytes);
  } else if (indexState === 'changed') {
    await writeFile(indexPath, 'pre-build-mismatch');
  } else if (indexState === 'unreadable') {
    await mkdir(indexPath);
  } else if (indexState !== 'missing') {
    throw new Error(`Unknown fixture index state: ${indexState}`);
  }

  await writeFile(path.join(scriptsDir, 'generate-structured-data-pages.mjs'), structuredGeneratorStub);
  await writeFile(path.join(scriptsDir, 'generate-sitemap-index.mjs'), sitemapIndexGeneratorStub);
  for (const name of preserveTestFiles) {
    await writeFile(path.join(scriptsDir, name), testStub(name));
  }

  const vitePath = path.join(binDir, 'vite');
  await writeFile(vitePath, viteStub);
  await chmod(vitePath, 0o755);

  const env = {
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    CLICKPDF_BUILD_MODE: 'sitemap-preserving',
    CLICKPDF_GUARD_SCENARIO: scenario,
    CLICKPDF_GUARD_MARKERS: markerDir,
    CLICKPDF_PRESERVE_LLMS_SHA256: sha256(protectedSourceBytes['llms.txt']),
    CLICKPDF_PRESERVE_LLMS_FULL_SHA256: sha256(protectedSourceBytes['llms-full.txt']),
  };

  return {
    appDir: fixtureApp,
    env,
    indexPath,
    markerDir,
    publicDir,
    async invoke({ indexHash = approvedSitemapIndexSha256, omitIndexHash = false } = {}) {
      const childEnv = { ...env };
      if (omitIndexHash) {
        delete childEnv.CLICKPDF_PRESERVE_SITEMAP_INDEX_SHA256;
      } else {
        childEnv.CLICKPDF_PRESERVE_SITEMAP_INDEX_SHA256 = indexHash;
      }
      const result = spawnSync(
        process.execPath,
        [path.join(scriptsDir, 'run-clickpdf-build.mjs')],
        {
          cwd: fixtureApp,
          env: childEnv,
          encoding: 'utf8',
          timeout: 30_000,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
      assert.equal(result.error, undefined, 'the temporary runner process must start');
      return result;
    },
  };
}

function outputOf(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function assertNoApprovedIndexHash(output) {
  assert.ok(
    !output.includes(approvedSitemapIndexSha256),
    'error output must not expose the approved sitemap-index hash',
  );
}

async function markerNames(fixture) {
  return readdir(fixture.markerDir);
}

async function assertAllMarkersBelongToFixture(fixture) {
  for (const marker of await markerNames(fixture)) {
    assert.equal(
      await readFile(path.join(fixture.markerDir, marker), 'utf8'),
      fixture.appDir,
      `${marker} must be an isolated stub command under the temporary fixture`,
    );
  }
}

async function assertProtectedSourceBytesUnchanged(fixture) {
  for (const name of protectedNames) {
    assert.deepEqual(
      await readFile(path.join(fixture.publicDir, name)),
      protectedSourceBytes[name],
      `the isolated runner must not alter source public/${name}`,
    );
  }
}

test('missing sitemap-index hash fails before any command without changing fixtures', async (t) => {
  const fixture = await createFixture(t);
  const result = await fixture.invoke({ omitIndexHash: true });
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /CLICKPDF_PRESERVE_SITEMAP_INDEX_SHA256.*actual status: missing/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  assert.deepEqual(await readFile(fixture.indexPath), sitemapIndexBytes);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('invalid hash format fails closed before any command', async (t) => {
  const fixture = await createFixture(t);
  const result = await fixture.invoke({ indexHash: 'not-a-sha256' });
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /actual status: invalid SHA-256 format/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  assert.deepEqual(await readFile(fixture.indexPath), sitemapIndexBytes);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('valid-format but incorrect hash fails closed before any command', async (t) => {
  const fixture = await createFixture(t);
  const result = await fixture.invoke({ indexHash: '0'.repeat(64) });
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /actual status: does not match the owner-approved baseline/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  assert.deepEqual(await readFile(fixture.indexPath), sitemapIndexBytes);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('missing sitemap index fails before any command and remains missing', async (t) => {
  const fixture = await createFixture(t, { indexState: 'missing' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /before build; expected status: approved SHA-256 match; actual status: missing/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  await assert.rejects(readFile(fixture.indexPath), { code: 'ENOENT' });
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('unreadable sitemap index fails safely and remains untouched', async (t) => {
  const fixture = await createFixture(t, { indexState: 'unreadable' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /before build; expected status: approved SHA-256 match; actual status: unreadable/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  assert.equal((await (await import('node:fs/promises')).stat(fixture.indexPath)).isDirectory(), true);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('pre-build sitemap-index mismatch is rejected without rewriting the output', async (t) => {
  const fixture = await createFixture(t, { indexState: 'changed' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /before build; expected status: approved SHA-256 match; actual status: hash mismatch/i);
  assertNoApprovedIndexHash(output);
  assert.deepEqual(await markerNames(fixture), []);
  assert.equal(await readFile(fixture.indexPath, 'utf8'), 'pre-build-mismatch');
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('valid approved hash and unchanged output pass all isolated guard checks', async (t) => {
  const fixture = await createFixture(t);
  const result = await fixture.invoke();
  const markers = await markerNames(fixture);

  assert.equal(result.status, 0, outputOf(result));
  assert.ok(markers.includes('vite'));
  assert.ok(markers.includes('structured-data'));
  assert.ok(markers.includes('sitemap-index'));
  assert.ok(markers.some((name) => name.startsWith('test-')));
  await assertAllMarkersBelongToFixture(fixture);
  assert.deepEqual(await readFile(fixture.indexPath), sitemapIndexBytes);
  for (const name of protectedNames) {
    assert.deepEqual(
      await readFile(path.join(fixture.appDir, 'dist', 'public', name)),
      protectedSourceBytes[name],
      `dist/public/${name} remains byte-identical in the stubbed build`,
    );
  }
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('a changed sitemap index after the simulated build is reported and not restored', async (t) => {
  const fixture = await createFixture(t, { scenario: 'after-build-changed' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /after build; expected status: approved SHA-256 match; actual status: hash mismatch/i);
  assertNoApprovedIndexHash(output);
  assert.equal(await readFile(fixture.indexPath, 'utf8'), 'changed-by-stub-index-generator');
  const markers = await markerNames(fixture);
  assert.ok(markers.includes('vite'));
  assert.ok(markers.includes('structured-data'));
  assert.ok(markers.includes('sitemap-index'));
  assert.ok(!markers.some((name) => name.startsWith('test-')));
  await assertAllMarkersBelongToFixture(fixture);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('a changed sitemap index after simulated tests is reported and not restored', async (t) => {
  const fixture = await createFixture(t, { scenario: 'after-tests-changed' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /after Preserve Build tests; expected status: approved SHA-256 match; actual status: hash mismatch/i);
  assertNoApprovedIndexHash(output);
  assert.equal(await readFile(fixture.indexPath, 'utf8'), 'changed-by-stub-tests');
  await assertAllMarkersBelongToFixture(fixture);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('a build-command failure still reports a changed sitemap index without restoring it', async (t) => {
  const fixture = await createFixture(t, { scenario: 'build-failure-changed' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /after an interrupted build; expected status: approved SHA-256 match; actual status: hash mismatch/i);
  assertNoApprovedIndexHash(output);
  assert.equal(await readFile(fixture.indexPath, 'utf8'), 'changed-by-stub-build');
  const markers = await markerNames(fixture);
  assert.deepEqual(markers, ['vite']);
  await assertAllMarkersBelongToFixture(fixture);
  await assertProtectedSourceBytesUnchanged(fixture);
});

test('a test-command failure still reports a missing sitemap index without restoring it', async (t) => {
  const fixture = await createFixture(t, { scenario: 'test-failure-missing' });
  const result = await fixture.invoke();
  const output = outputOf(result);

  assert.notEqual(result.status, 0);
  assert.match(output, /SIMULATED_TEST_COMMAND_FAILURE/);
  assert.match(output, /after failed Preserve Build tests; expected status: approved SHA-256 match; actual status: missing/i);
  assertNoApprovedIndexHash(output);
  await assert.rejects(readFile(fixture.indexPath), { code: 'ENOENT' });
  await assertAllMarkersBelongToFixture(fixture);
  await assertProtectedSourceBytesUnchanged(fixture);
});

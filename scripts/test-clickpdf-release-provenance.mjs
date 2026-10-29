import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import worker from '../artifacts/clickpdf/cloudflare-worker.mjs';
import {
  RELEASE_MANIFEST_PATH,
  assertDeploymentMatchesManifest,
  collectStaticAssetEntries,
  computeBuildId,
  computeAssetManifestSha256,
  createReleaseManifest,
  formatDeploymentMessage,
  getDeploymentMessage,
  parseDeploymentMessage,
  sha256,
  validateReleaseManifest,
} from './clickpdf-release-provenance.mjs';
import { verifyPublishedAssets } from './verify-clickpdf-release.mjs';

const sourceRevision = 'a'.repeat(40);
const buildInputs = {
  nodeVersion: 'v24.22.1',
  pnpmVersion: '10.26.1',
  wranglerVersion: '4.155.0',
  lockfileSha256: 'b'.repeat(64),
  wranglerConfigSha256: 'c'.repeat(64),
};

function manifestFor(assetBytes = Buffer.from('asset bytes')) {
  const assets = [{
    path: '/assets/test.js',
    bytes: assetBytes.byteLength,
    sha256: sha256(assetBytes),
  }];
  return createReleaseManifest({ sourceRevision, assets, buildInputs });
}

test('release manifest hashes static assets and creates a deterministic build ID', () => {
  const first = manifestFor();
  const second = createReleaseManifest({
    sourceRevision,
    assets: [...first.assets].reverse(),
    buildInputs: { ...buildInputs },
  });

  assert.deepEqual(first, second);
  assert.equal(validateReleaseManifest(first), true);
  assert.equal(
    first.buildId,
    computeBuildId({
      sourceRevision,
      assetManifestSha256: computeAssetManifestSha256(first.assets),
      buildInputs,
    }),
  );
  assert.equal(
    formatDeploymentMessage(first),
    `s=${sourceRevision};a=${first.assetManifestSha256}`,
  );
});

test('release manifest validation rejects tampered asset records and build IDs', () => {
  const manifest = manifestFor();
  assert.throws(() => validateReleaseManifest({
    ...manifest,
    assets: [{ ...manifest.assets[0], sha256: 'd'.repeat(64) }],
  }), /asset-manifest SHA-256/);
  assert.throws(() => validateReleaseManifest({
    ...manifest,
    buildId: 'e'.repeat(64),
  }), /Build ID/);
});

test('deployment record maps its active version to the exact source revision and build', () => {
  const manifest = manifestFor();
  const message = formatDeploymentMessage(manifest);
  const deployment = {
    id: 'deployment-test',
    versions: [{ version_id: 'version-test', percentage: 100 }],
    annotations: { 'workers/message': message },
  };

  assert.equal(getDeploymentMessage(deployment), message);
  assert.deepEqual(parseDeploymentMessage(message), {
    sourceRevision,
    assetManifestSha256: manifest.assetManifestSha256,
  });
  assert.deepEqual(assertDeploymentMatchesManifest(deployment, manifest), {
    deploymentId: 'deployment-test',
    versionId: 'version-test',
    sourceRevision,
    buildId: manifest.buildId,
    assetManifestSha256: manifest.assetManifestSha256,
    assetCount: 1,
  });
  assert.throws(
    () => assertDeploymentMatchesManifest({
      ...deployment,
      versions: [{ version_id: 'version-test', percentage: 90 }],
    }, manifest),
    /100% traffic/,
  );
});

test('static asset collection is sorted, hashes bytes, and excludes its own release file', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-release-'));
  try {
    await mkdir(path.join(directory, 'assets'));
    await writeFile(path.join(directory, 'assets', 'z.js'), 'z');
    await writeFile(path.join(directory, 'assets', 'a.js'), 'a');
    await writeFile(path.join(directory, '__release.json'), '{"old":true}');
    const entries = await collectStaticAssetEntries(directory);

    assert.deepEqual(entries.map((entry) => entry.path), ['/assets/a.js', '/assets/z.js']);
    assert.equal(entries[0].sha256, sha256(await readFile(path.join(directory, 'assets', 'a.js'))));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('read-only published asset verification compares served bytes with the manifest', async () => {
  const content = Buffer.from('asset bytes');
  const manifest = manifestFor(content);
  const checkedUrls = [];
  await verifyPublishedAssets(manifest, new URL('https://example.test'), async (url) => {
    checkedUrls.push(String(url));
    return new Response(content);
  });

  assert.deepEqual(checkedUrls, ['https://example.test/assets/test.js']);
  await assert.rejects(
    verifyPublishedAssets(manifest, new URL('https://example.test'), async () => new Response('wrong')),
    /published bytes differ/,
  );
});

test('release manifest endpoint is served without cache and excluded from indexing', async () => {
  const releaseJson = '{"schemaVersion":1}';
  const response = await worker.fetch(
    new Request(`https://www.clickpdf.net${RELEASE_MANIFEST_PATH}`),
    {
      ASSETS: {
        fetch: async () => new Response(releaseJson, {
          headers: { 'content-type': 'application/json' },
        }),
      },
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(await response.text(), releaseJson);
});

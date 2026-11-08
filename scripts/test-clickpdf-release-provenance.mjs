import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
import { createClickPdfReleaseManifest } from './create-clickpdf-release-manifest.mjs';
import { verifyPublishedAssets } from './verify-clickpdf-release.mjs';
import {
  assertApprovedReleaseCommit,
  assertPrebuiltAssetInventoryMatches,
  assertPrebuiltManifestContract,
  verifyPrebuiltArtifacts,
} from './clickpdf-prebuilt-release.mjs';

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
  }), /asset-manifest SHA-256/i);
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

test('release manifest writer records pinned toolchain and source inputs', async () => {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-release-writer-'));
  const publicDirectory = path.join(rootDirectory, 'artifacts/clickpdf/dist/public');
  try {
    await mkdir(publicDirectory, { recursive: true });
    await writeFile(path.join(rootDirectory, 'pnpm-lock.yaml'), 'lock-data');
    await writeFile(path.join(rootDirectory, 'wrangler.toml'), 'name = "clickpddf"');
    await writeFile(path.join(publicDirectory, 'index.html'), '<main>ClickPDF</main>');

    const { manifest, outputPath } = await createClickPdfReleaseManifest({
      rootDirectory,
      sourceRevision,
      pnpmVersion: '10.26.1',
    });
    const written = JSON.parse(await readFile(outputPath, 'utf8'));

    assert.deepEqual(written, manifest);
    assert.equal(manifest.buildInputs.pnpmVersion, '10.26.1');
    assert.equal(manifest.buildInputs.wranglerVersion, '4.155.0');
    assert.equal(manifest.assets.length, 1);
    assert.equal(validateReleaseManifest(manifest), true);
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
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

test('prebuilt release contract pins its source SHA, Preserve Build mode, and protected hashes', () => {
  const protectedFileSha256 = {
    'artifacts/clickpdf/public/sitemap.xml': '1'.repeat(64),
    'artifacts/clickpdf/dist/public/sitemap.xml': '1'.repeat(64),
    'artifacts/clickpdf/public/llms.txt': '2'.repeat(64),
    'artifacts/clickpdf/dist/public/llms.txt': '2'.repeat(64),
    'artifacts/clickpdf/public/llms-full.txt': '3'.repeat(64),
    'artifacts/clickpdf/dist/public/llms-full.txt': '3'.repeat(64),
    'artifacts/clickpdf/dist/public/sitemap_index.xml': '4'.repeat(64),
  };
  const manifest = createReleaseManifest({
    sourceRevision,
    assets: [{ path: '/index.html', bytes: 1, sha256: sha256(Buffer.from('x')) }],
    buildInputs: {
      ...buildInputs,
      buildMode: 'sitemap-preserving',
      protectedFileSha256,
    },
  });

  assert.equal(
    assertPrebuiltManifestContract(manifest, sourceRevision, protectedFileSha256),
    true,
  );
  const wrongSourceManifest = createReleaseManifest({
    sourceRevision: 'b'.repeat(40),
    assets: manifest.assets,
    buildInputs: manifest.buildInputs,
  });
  assert.throws(
    () => assertPrebuiltManifestContract(wrongSourceManifest, sourceRevision, protectedFileSha256),
    /source revision/i,
  );
  const standardModeManifest = createReleaseManifest({
    sourceRevision,
    assets: manifest.assets,
    buildInputs: { ...manifest.buildInputs, buildMode: 'standard' },
  });
  assert.throws(
    () => assertPrebuiltManifestContract(standardModeManifest, sourceRevision, protectedFileSha256),
    /sitemap-preserving/i,
  );
  assert.throws(
    () => assertPrebuiltManifestContract(manifest, sourceRevision, {
      ...protectedFileSha256,
      'artifacts/clickpdf/public/sitemap.xml': 'f'.repeat(64),
    }),
    /protected-file hashes/i,
  );
});

test('prebuilt release commit must be a single approved-baseline child with an exact file scope', async () => {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-release-scope-'));
  const runGit = (args) => execFileSync('git', args, {
    cwd: rootDirectory,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  try {
    runGit(['init', '--quiet']);
    runGit(['config', 'user.name', 'ClickPDF Test']);
    runGit(['config', 'user.email', 'clickpdf-test@example.invalid']);
    await writeFile(path.join(rootDirectory, 'base.txt'), 'base');
    runGit(['add', 'base.txt']);
    runGit(['commit', '--quiet', '-m', 'test base']);
    const parent = runGit(['rev-parse', 'HEAD']);

    await writeFile(path.join(rootDirectory, 'approved.txt'), 'approved');
    runGit(['add', 'approved.txt']);
    runGit(['commit', '--quiet', '-m', 'test release']);
    const sourceRevision = runGit(['rev-parse', 'HEAD']);

    assert.deepEqual(
      assertApprovedReleaseCommit({
        rootDirectory,
        sourceRevision,
        expectedParent: parent,
        expectedPaths: ['approved.txt'],
      }),
      { parent, files: ['approved.txt'] },
    );
    assert.throws(
      () => assertApprovedReleaseCommit({
        rootDirectory,
        sourceRevision,
        expectedParent: 'f'.repeat(40),
        expectedPaths: ['approved.txt'],
      }),
      /sole parent/i,
    );
    assert.throws(
      () => assertApprovedReleaseCommit({
        rootDirectory,
        sourceRevision,
        expectedParent: parent,
        expectedPaths: ['unrelated.txt'],
      }),
      /file scope mismatch/i,
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test('prebuilt artifact verification checks exact source, protected files, worker source, and asset inventory', async () => {
  const rootDirectory = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-prebuilt-'));
  const publicSource = path.join(rootDirectory, 'artifacts/clickpdf/public');
  const publicOutput = path.join(rootDirectory, 'artifacts/clickpdf/dist/public');
  const sourceRevision = 'd'.repeat(40);
  const protectedFileSha256 = {};
  try {
    await mkdir(path.join(publicOutput, 'assets'), { recursive: true });
    await mkdir(publicSource, { recursive: true });
    const protectedPairs = [
      ['artifacts/clickpdf/public/sitemap.xml', 'artifacts/clickpdf/dist/public/sitemap.xml', 'sitemap'],
      ['artifacts/clickpdf/public/llms.txt', 'artifacts/clickpdf/dist/public/llms.txt', 'llms'],
      ['artifacts/clickpdf/public/llms-full.txt', 'artifacts/clickpdf/dist/public/llms-full.txt', 'llms-full'],
    ];
    for (const [sourcePath, outputPath, content] of protectedPairs) {
      const bytes = Buffer.from(content);
      await mkdir(path.dirname(path.join(rootDirectory, sourcePath)), { recursive: true });
      await mkdir(path.dirname(path.join(rootDirectory, outputPath)), { recursive: true });
      await writeFile(path.join(rootDirectory, sourcePath), bytes);
      await writeFile(path.join(rootDirectory, outputPath), bytes);
      protectedFileSha256[sourcePath] = sha256(bytes);
      protectedFileSha256[outputPath] = sha256(bytes);
    }
    const sitemapIndexBytes = Buffer.from('sitemap index');
    await writeFile(path.join(publicOutput, 'sitemap_index.xml'), sitemapIndexBytes);
    protectedFileSha256['artifacts/clickpdf/dist/public/sitemap_index.xml'] = sha256(sitemapIndexBytes);

    const workerSource = Buffer.from('export default {}');
    await writeFile(path.join(rootDirectory, 'artifacts/clickpdf/cloudflare-worker.mjs'), workerSource);
    const lockfile = Buffer.from('lockfile');
    const wranglerConfig = Buffer.from('name = "clickpddf"');
    await writeFile(path.join(rootDirectory, 'pnpm-lock.yaml'), lockfile);
    await writeFile(path.join(rootDirectory, 'wrangler.toml'), wranglerConfig);
    await writeFile(path.join(publicOutput, 'assets/app.js'), 'app');
    const assets = await collectStaticAssetEntries(publicOutput);
    const manifest = createReleaseManifest({
      sourceRevision,
      assets,
      buildInputs: {
        ...buildInputs,
        lockfileSha256: sha256(lockfile),
        wranglerConfigSha256: sha256(wranglerConfig),
        workerSourceSha256: sha256(workerSource),
        buildMode: 'sitemap-preserving',
        protectedFileSha256,
      },
    });

    assert.equal(
      await verifyPrebuiltArtifacts({
        rootDirectory,
        sourceRevision,
        manifest,
        expectedProtectedHashes: protectedFileSha256,
      }),
      manifest,
    );
    assert.equal(assertPrebuiltAssetInventoryMatches(assets, assets), true);
    assert.throws(
      () => assertPrebuiltAssetInventoryMatches(assets, [...assets, {
        path: '/unexpected.js',
        bytes: 1,
        sha256: sha256(Buffer.from('x')),
      }]),
      /do not match/i,
    );

    await writeFile(path.join(publicOutput, 'assets/app.js'), 'changed');
    await assert.rejects(
      verifyPrebuiltArtifacts({
        rootDirectory,
        sourceRevision,
        manifest,
        expectedProtectedHashes: protectedFileSha256,
      }),
      /do not match the recorded artifact inventory/i,
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
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

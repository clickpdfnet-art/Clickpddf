import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  collectStaticAssetEntries,
  createReleaseManifest,
  sha256,
  stableJson,
  validateReleaseManifest,
  WRANGLER_VERSION,
} from './clickpdf-release-provenance.mjs';

export const CLICKPDF_PRESERVE_BUILD_MODE = 'sitemap-preserving';
export const APPROVED_RELEASE_PARENT = '29ec6dc52fc9c7d2f050f03833319159b41fd966';

export const APPROVED_RELEASE_PATHS = Object.freeze([
  'artifacts/clickpdf/package.json',
  'artifacts/clickpdf/public/llms-full.txt',
  'artifacts/clickpdf/scripts/run-clickpdf-build.mjs',
  'artifacts/clickpdf/scripts/test-merge-pdf-regression.mjs',
  'artifacts/clickpdf/scripts/test-pdf-background-regression.mjs',
  'artifacts/clickpdf/scripts/test-preserve-sitemap-index-guard.mjs',
  'artifacts/clickpdf/scripts/test-sitemap-preserve-mode.mjs',
  'artifacts/clickpdf/src/components/SortableFileList.tsx',
  'artifacts/clickpdf/src/components/ToolWorkspace.tsx',
  'artifacts/clickpdf/src/data/toolPageContent.ts',
  'artifacts/clickpdf/src/data/toolSeoData.ts',
  'artifacts/clickpdf/src/data/toolsData.ts',
  'artifacts/clickpdf/src/i18n/toolSeoContentTranslations.json',
  'artifacts/clickpdf/src/i18n/translations.ts',
  'artifacts/clickpdf/src/utils/mergePdfDocument.ts',
  'artifacts/clickpdf/src/utils/pdfBackground.ts',
  'artifacts/clickpdf/src/utils/pdfEngine.ts',
  'artifacts/clickpdf/src/workers/pdfOperations.worker.ts',
  'scripts/clickpdf-prebuilt-release.mjs',
  'scripts/deploy-clickpdf.mjs',
  'scripts/prepare-clickpdf-prebuilt-release.mjs',
  'scripts/test-clickpdf-release-provenance.mjs',
]);

export const APPROVED_PROTECTED_HASHES = Object.freeze({
  'artifacts/clickpdf/public/sitemap.xml':
    '5c67e14e85437cc63381ff138d344211fe0ef4260be7f0db4fb5e5708d233047',
  'artifacts/clickpdf/dist/public/sitemap.xml':
    '5c67e14e85437cc63381ff138d344211fe0ef4260be7f0db4fb5e5708d233047',
  'artifacts/clickpdf/public/llms.txt':
    'df8a51ef3130d30caa5d6e7a6c53956f9340e162790c29c9a27e71a1dbc92ca0',
  'artifacts/clickpdf/dist/public/llms.txt':
    'df8a51ef3130d30caa5d6e7a6c53956f9340e162790c29c9a27e71a1dbc92ca0',
  'artifacts/clickpdf/public/llms-full.txt':
    '8652b42d296f487703434ef341904423791ed69d70e335bd7be3c07c48bb155a',
  'artifacts/clickpdf/dist/public/llms-full.txt':
    '8652b42d296f487703434ef341904423791ed69d70e335bd7be3c07c48bb155a',
  'artifacts/clickpdf/dist/public/sitemap_index.xml':
    '82a73902c844ea1162dbfeb84e263dd7afb973de9c8f59aed08a4c767bbcb2e7',
});

const EXPECTED_HASH_ENV = Object.freeze({
  CLICKPDF_EXPECTED_SITEMAP_SHA256:
    '5c67e14e85437cc63381ff138d344211fe0ef4260be7f0db4fb5e5708d233047',
  CLICKPDF_EXPECTED_LLMS_SHA256:
    'df8a51ef3130d30caa5d6e7a6c53956f9340e162790c29c9a27e71a1dbc92ca0',
  CLICKPDF_EXPECTED_LLMS_FULL_SHA256:
    '8652b42d296f487703434ef341904423791ed69d70e335bd7be3c07c48bb155a',
  CLICKPDF_EXPECTED_SITEMAP_INDEX_SHA256:
    '82a73902c844ea1162dbfeb84e263dd7afb973de9c8f59aed08a4c767bbcb2e7',
});

const PRESERVE_RUNNER_HASH_ENV = Object.freeze({
  CLICKPDF_PRESERVE_LLMS_SHA256: EXPECTED_HASH_ENV.CLICKPDF_EXPECTED_LLMS_SHA256,
  CLICKPDF_PRESERVE_LLMS_FULL_SHA256: EXPECTED_HASH_ENV.CLICKPDF_EXPECTED_LLMS_FULL_SHA256,
  CLICKPDF_PRESERVE_SITEMAP_INDEX_SHA256: EXPECTED_HASH_ENV.CLICKPDF_EXPECTED_SITEMAP_INDEX_SHA256,
});

export function assertApprovedPreserveEnvironment(env = process.env) {
  if (env.CLICKPDF_BUILD_MODE !== CLICKPDF_PRESERVE_BUILD_MODE) {
    throw new Error(`Prebuilt release requires CLICKPDF_BUILD_MODE=${CLICKPDF_PRESERVE_BUILD_MODE}.`);
  }

  for (const [name, expected] of Object.entries({
    ...EXPECTED_HASH_ENV,
    ...PRESERVE_RUNNER_HASH_ENV,
  })) {
    if (env[name]?.trim().toLowerCase() !== expected) {
      throw new Error(`${name} is missing or does not match its owner-approved SHA-256.`);
    }
  }
}

export function assertPrebuiltManifestContract(
  manifest,
  sourceRevision,
  expectedProtectedHashes = APPROVED_PROTECTED_HASHES,
) {
  validateReleaseManifest(manifest);
  if (manifest.sourceRevision !== sourceRevision) {
    throw new Error('Prebuilt release source revision does not match the clean Git HEAD.');
  }
  if (manifest.buildInputs.buildMode !== CLICKPDF_PRESERVE_BUILD_MODE) {
    throw new Error('Prebuilt release was not created by the sitemap-preserving build mode.');
  }
  if (
    stableJson(manifest.buildInputs.protectedFileSha256) !==
    stableJson(expectedProtectedHashes)
  ) {
    throw new Error('Prebuilt release protected-file hashes do not match the approved baselines.');
  }
  return true;
}

export function assertPrebuiltAssetInventoryMatches(manifestAssets, actualAssets) {
  if (stableJson(manifestAssets) !== stableJson(actualAssets)) {
    throw new Error('Prebuilt static assets do not match the recorded artifact inventory.');
  }
  return true;
}

export function assertApprovedReleaseCommit({
  rootDirectory,
  sourceRevision,
  expectedParent = APPROVED_RELEASE_PARENT,
  expectedPaths = APPROVED_RELEASE_PATHS,
}) {
  const parentLine = execFileSync(
    'git',
    ['rev-list', '--parents', '-n', '1', sourceRevision],
    { cwd: rootDirectory, encoding: 'utf8' },
  ).trim().split(/\s+/);
  if (parentLine.length !== 2 || parentLine[0] !== sourceRevision || parentLine[1] !== expectedParent) {
    throw new Error('Release commit must have exactly the approved production baseline as its sole parent.');
  }

  const actualPaths = execFileSync(
    'git',
    ['diff-tree', '--no-commit-id', '--name-only', '-r', sourceRevision],
    { cwd: rootDirectory, encoding: 'utf8' },
  ).trim().split(/\r?\n/).filter(Boolean).sort();
  const sortedExpectedPaths = [...expectedPaths].sort();
  if (stableJson(actualPaths) !== stableJson(sortedExpectedPaths)) {
    throw new Error(
      `Release commit file scope mismatch. Expected ${sortedExpectedPaths.length} approved files; ` +
      `found ${actualPaths.length}.`,
    );
  }
  return { parent: parentLine[1], files: actualPaths };
}

async function assertProtectedFiles(rootDirectory, expectedHashes) {
  for (const [relativePath, expectedHash] of Object.entries(expectedHashes)) {
    const actualHash = sha256(await readFile(path.join(rootDirectory, relativePath)));
    if (actualHash !== expectedHash) {
      throw new Error(`Protected release file does not match its approved SHA-256: ${relativePath}`);
    }
  }
}

async function assertBuildInputsMatch(rootDirectory, buildInputs) {
  const lockfile = await readFile(path.join(rootDirectory, 'pnpm-lock.yaml'));
  const wranglerConfig = await readFile(path.join(rootDirectory, 'wrangler.toml'));
  const workerSource = await readFile(path.join(rootDirectory, 'artifacts/clickpdf/cloudflare-worker.mjs'));

  if (buildInputs.lockfileSha256 !== sha256(lockfile)) {
    throw new Error('Prebuilt release lockfile hash does not match the current source revision.');
  }
  if (buildInputs.wranglerConfigSha256 !== sha256(wranglerConfig)) {
    throw new Error('Prebuilt release Wrangler configuration hash does not match the current source revision.');
  }
  if (buildInputs.wranglerVersion !== WRANGLER_VERSION) {
    throw new Error('Prebuilt release Wrangler version does not match the configured deployment version.');
  }
  if (buildInputs.workerSourceSha256 !== sha256(workerSource)) {
    throw new Error('Prebuilt release Worker source hash does not match the current source revision.');
  }
}

export async function verifyPrebuiltArtifacts({
  rootDirectory,
  sourceRevision,
  manifest,
  expectedProtectedHashes = APPROVED_PROTECTED_HASHES,
}) {
  assertPrebuiltManifestContract(manifest, sourceRevision, expectedProtectedHashes);
  await assertProtectedFiles(rootDirectory, expectedProtectedHashes);
  await assertBuildInputsMatch(rootDirectory, manifest.buildInputs);

  const publicDirectory = path.join(rootDirectory, 'artifacts/clickpdf/dist/public');
  const actualAssets = await collectStaticAssetEntries(publicDirectory);
  assertPrebuiltAssetInventoryMatches(manifest.assets, actualAssets);
  return manifest;
}

export async function verifyPrebuiltRelease({
  rootDirectory,
  sourceRevision,
  env = process.env,
}) {
  assertApprovedPreserveEnvironment(env);
  assertApprovedReleaseCommit({ rootDirectory, sourceRevision });
  const manifestPath = path.join(
    rootDirectory,
    'artifacts/clickpdf/dist/public/__release.json',
  );
  let manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read the prebuilt release manifest (${error.code || 'invalid JSON'}).`);
  }
  return verifyPrebuiltArtifacts({ rootDirectory, sourceRevision, manifest });
}

export async function createPrebuiltReleaseManifest({
  rootDirectory,
  sourceRevision,
  pnpmVersion,
  env = process.env,
}) {
  assertApprovedPreserveEnvironment(env);
  assertApprovedReleaseCommit({ rootDirectory, sourceRevision });
  if (!pnpmVersion) throw new Error('pnpmVersion is required to record the build toolchain.');

  await assertProtectedFiles(rootDirectory, APPROVED_PROTECTED_HASHES);
  const [lockfile, wranglerConfig, workerSource] = await Promise.all([
    readFile(path.join(rootDirectory, 'pnpm-lock.yaml')),
    readFile(path.join(rootDirectory, 'wrangler.toml')),
    readFile(path.join(rootDirectory, 'artifacts/clickpdf/cloudflare-worker.mjs')),
  ]);
  const buildInputs = {
    nodeVersion: process.version,
    pnpmVersion,
    wranglerVersion: WRANGLER_VERSION,
    lockfileSha256: sha256(lockfile),
    wranglerConfigSha256: sha256(wranglerConfig),
    workerSourceSha256: sha256(workerSource),
    buildMode: CLICKPDF_PRESERVE_BUILD_MODE,
    protectedFileSha256: APPROVED_PROTECTED_HASHES,
  };
  const publicDirectory = path.join(rootDirectory, 'artifacts/clickpdf/dist/public');
  const assets = await collectStaticAssetEntries(publicDirectory);
  const manifest = createReleaseManifest({ sourceRevision, assets, buildInputs });
  const manifestPath = path.join(publicDirectory, '__release.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  await verifyPrebuiltArtifacts({ rootDirectory, sourceRevision, manifest });
  return { manifest, manifestPath };
}

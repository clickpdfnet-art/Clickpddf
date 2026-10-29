import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const CLICKPDF_WORKER_NAME = 'clickpddf';
export const CLICKPDF_CANONICAL_ORIGIN = 'https://www.clickpdf.net';
export const RELEASE_MANIFEST_NAME = '__release.json';
export const RELEASE_MANIFEST_PATH = `/${RELEASE_MANIFEST_NAME}`;
export const WRANGLER_VERSION = '4.155.0';

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const GIT_REVISION_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256Json(value) {
  return sha256(stableJson(value));
}

export function sortAssetEntries(entries) {
  return [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export function computeAssetManifestSha256(assets) {
  return sha256Json(sortAssetEntries(assets));
}

export function computeBuildId({ sourceRevision, assetManifestSha256, buildInputs }) {
  return sha256Json({
    schemaVersion: 1,
    sourceRevision,
    assetManifestSha256,
    buildInputs,
  });
}

export function createReleaseManifest({ sourceRevision, assets, buildInputs }) {
  if (!GIT_REVISION_PATTERN.test(sourceRevision)) {
    throw new Error('sourceRevision must be a full 40- or 64-character Git SHA.');
  }

  const sortedAssets = sortAssetEntries(assets);
  const seenPaths = new Set();
  for (const asset of sortedAssets) {
    if (
      typeof asset.path !== 'string' ||
      !asset.path.startsWith('/') ||
      asset.path.startsWith('//') ||
      asset.path.split('/').some((segment) => segment === '.' || segment === '..' || segment.includes('\\'))
    ) {
      throw new Error(`Invalid static asset path: ${String(asset.path)}`);
    }
    if (asset.path === RELEASE_MANIFEST_PATH) {
      throw new Error(`${RELEASE_MANIFEST_PATH} is excluded from its own asset digest.`);
    }
    if (seenPaths.has(asset.path)) throw new Error(`Duplicate static asset path: ${asset.path}`);
    seenPaths.add(asset.path);
    if (!Number.isSafeInteger(asset.bytes) || asset.bytes < 0) {
      throw new Error(`Invalid byte size for static asset ${asset.path}.`);
    }
    if (!SHA256_PATTERN.test(asset.sha256)) {
      throw new Error(`Invalid SHA-256 for static asset ${asset.path}.`);
    }
  }

  const assetManifestSha256 = computeAssetManifestSha256(sortedAssets);
  const manifest = {
    schemaVersion: 1,
    sourceRevision,
    buildId: computeBuildId({ sourceRevision, assetManifestSha256, buildInputs }),
    assetManifestSha256,
    buildInputs: canonicalize(buildInputs),
    assets: sortedAssets,
  };
  validateReleaseManifest(manifest);
  return manifest;
}

export function validateReleaseManifest(manifest) {
  if (!manifest || manifest.schemaVersion !== 1) {
    throw new Error('Unsupported or missing ClickPDF release manifest schema.');
  }
  if (!GIT_REVISION_PATTERN.test(manifest.sourceRevision ?? '')) {
    throw new Error('Release manifest does not contain a full Git revision.');
  }
  if (!SHA256_PATTERN.test(manifest.assetManifestSha256 ?? '')) {
    throw new Error('Release manifest does not contain an asset-manifest SHA-256.');
  }
  if (!SHA256_PATTERN.test(manifest.buildId ?? '')) {
    throw new Error('Release manifest does not contain a build ID.');
  }
  if (
    !Array.isArray(manifest.assets) ||
    manifest.assets.length === 0 ||
    !manifest.buildInputs ||
    typeof manifest.buildInputs !== 'object' ||
    Array.isArray(manifest.buildInputs)
  ) {
    throw new Error('Release manifest is missing its asset list or build inputs.');
  }

  const paths = new Set();
  for (const asset of manifest.assets) {
    if (
      typeof asset.path !== 'string' ||
      !asset.path.startsWith('/') ||
      asset.path.startsWith('//') ||
      asset.path.split('/').some((segment) => segment === '.' || segment === '..' || segment.includes('\\')) ||
      asset.path === RELEASE_MANIFEST_PATH ||
      paths.has(asset.path)
    ) {
      throw new Error('Release manifest contains an invalid or duplicate asset path.');
    }
    paths.add(asset.path);
    if (!Number.isSafeInteger(asset.bytes) || asset.bytes < 0 || !SHA256_PATTERN.test(asset.sha256 ?? '')) {
      throw new Error(`Release manifest contains invalid asset metadata for ${asset.path}.`);
    }
  }

  const actualAssetDigest = computeAssetManifestSha256(manifest.assets);
  if (actualAssetDigest !== manifest.assetManifestSha256) {
    throw new Error('Asset-manifest SHA-256 does not match the listed static assets.');
  }
  const actualBuildId = computeBuildId({
    sourceRevision: manifest.sourceRevision,
    assetManifestSha256: actualAssetDigest,
    buildInputs: manifest.buildInputs,
  });
  if (actualBuildId !== manifest.buildId) {
    throw new Error('Build ID does not match the source, asset manifest, and build inputs.');
  }
  return true;
}

export function formatDeploymentMessage(manifest) {
  validateReleaseManifest(manifest);
  return `s=${manifest.sourceRevision};a=${manifest.assetManifestSha256}`;
}

export function parseDeploymentMessage(message) {
  if (typeof message !== 'string') return null;
  const match = message.match(
    /(?:^|;)s=((?:[a-f0-9]{40}|[a-f0-9]{64}));a=([a-f0-9]{64})(?:;|$)/,
  );
  return match ? { sourceRevision: match[1], assetManifestSha256: match[2] } : null;
}

export function getDeploymentMessage(deployment) {
  const candidates = [
    deployment?.message,
    deployment?.annotations?.['workers/message'],
    deployment?.metadata?.message,
    ...(Array.isArray(deployment?.versions)
      ? deployment.versions.flatMap((version) => [
          version?.message,
          version?.metadata?.message,
          version?.annotations?.['workers/message'],
        ])
      : []),
  ];
  for (const [key, value] of Object.entries(deployment?.annotations ?? {})) {
    if (/message/i.test(key)) candidates.push(value);
  }
  return candidates.find((value) => typeof value === 'string' && parseDeploymentMessage(value)) ?? null;
}

export function assertDeploymentMatchesManifest(deployment, manifest) {
  validateReleaseManifest(manifest);
  const activeVersions = (deployment?.versions ?? []).filter(
    (version) => Number(version?.percentage) > 0,
  );
  if (
    activeVersions.length !== 1 ||
    Number(activeVersions[0]?.percentage) !== 100 ||
    typeof (activeVersions[0]?.version_id ?? activeVersions[0]?.id) !== 'string'
  ) {
    throw new Error('Cloudflare deployment must have exactly one active version at 100% traffic.');
  }

  const message = getDeploymentMessage(deployment);
  const release = parseDeploymentMessage(message);
  if (!release) {
    throw new Error('Cloudflare deployment metadata is missing the source/build release message.');
  }
  if (
    release.sourceRevision !== manifest.sourceRevision ||
    release.assetManifestSha256 !== manifest.assetManifestSha256
  ) {
    throw new Error('Cloudflare deployment metadata does not match the published release manifest.');
  }

  return {
    deploymentId: deployment.id ?? null,
    versionId: activeVersions[0].version_id ?? activeVersions[0].id,
    sourceRevision: release.sourceRevision,
    buildId: manifest.buildId,
    assetManifestSha256: manifest.assetManifestSha256,
    assetCount: manifest.assets.length,
  };
}

export async function collectStaticAssetEntries(publicDirectory) {
  const assets = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`Static asset symlinks are not supported: ${fullPath}`);
      }
      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = path.relative(publicDirectory, fullPath).split(path.sep).join('/');
      const assetPath = `/${relativePath}`;
      if (assetPath === RELEASE_MANIFEST_PATH) continue;

      const content = await readFile(fullPath);
      assets.push({
        path: assetPath,
        bytes: content.byteLength,
        sha256: sha256(content),
      });
    }
  }

  await visit(publicDirectory);
  return sortAssetEntries(assets);
}

export function buildManifestUrlPath(assetPath) {
  return assetPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

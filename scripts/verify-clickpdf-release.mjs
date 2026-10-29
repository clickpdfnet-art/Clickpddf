import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  CLICKPDF_CANONICAL_ORIGIN,
  CLICKPDF_WORKER_NAME,
  RELEASE_MANIFEST_PATH,
  WRANGLER_VERSION,
  assertDeploymentMatchesManifest,
  buildManifestUrlPath,
  getDeploymentMessage,
  validateReleaseManifest,
  sha256,
} from './clickpdf-release-provenance.mjs';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function wranglerOutput(args) {
  return execFileSync(
    'pnpm',
    ['dlx', `wrangler@${WRANGLER_VERSION}`, ...args],
    { cwd: rootDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}

function parseBaseUrl(args) {
  const index = args.indexOf('--base-url');
  const raw = index >= 0 ? args[index + 1] : CLICKPDF_CANONICAL_ORIGIN;
  if (!raw) throw new Error('Provide a URL after --base-url.');
  const base = new URL(raw);
  if (base.protocol !== 'https:') throw new Error('Release verification requires an HTTPS base URL.');
  return base;
}

function parseDeploymentStatus() {
  const output = wranglerOutput([
    'deployments',
    'status',
    '--name',
    CLICKPDF_WORKER_NAME,
    '--json',
  ]);
  return JSON.parse(output);
}

function deploymentMessageFromWrangler() {
  const output = wranglerOutput(['deployments', 'status', '--name', CLICKPDF_WORKER_NAME]);
  const match = output.match(/^\s*Message:\s*(.+?)\s*$/m);
  return match?.[1] && match[1] !== '-' ? match[1] : null;
}

async function fetchReleaseManifest(baseUrl) {
  const manifestUrl = new URL(RELEASE_MANIFEST_PATH, baseUrl);
  const response = await fetch(manifestUrl, {
    headers: { 'cache-control': 'no-cache' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Release manifest request returned HTTP ${response.status}.`);
  return response.json();
}

function requestPathForAsset(assetPath) {
  if (assetPath === '/index.html') return '/';
  if (assetPath.endsWith('/index.html')) return assetPath.slice(0, -'index.html'.length);
  return assetPath;
}

export async function verifyPublishedAssets(manifest, baseUrl, fetchImpl = fetch) {
  validateReleaseManifest(manifest);
  const failures = [];
  let nextIndex = 0;
  const workerCount = Math.min(8, Math.max(1, manifest.assets.length));

  async function checkNextAssets() {
    while (nextIndex < manifest.assets.length) {
      const asset = manifest.assets[nextIndex];
      nextIndex += 1;
      try {
        const requestPath = requestPathForAsset(asset.path);
        const encodedPath = buildManifestUrlPath(requestPath);
        const url = new URL(encodedPath, baseUrl);
        const response = await fetchImpl(url, {
          redirect: 'follow',
          headers: {
            'accept-encoding': 'identity',
            'cache-control': 'no-cache',
          },
          signal: AbortSignal.timeout(30_000),
        });
        const content = Buffer.from(await response.arrayBuffer());
        const isCustomNotFoundPage = asset.path === '/404.html' && response.status === 404;
        if (!response.ok && !isCustomNotFoundPage) {
          throw new Error(`HTTP ${response.status}`);
        }
        if (content.byteLength !== asset.bytes || sha256(content) !== asset.sha256) {
          throw new Error('published bytes differ from the manifest');
        }
      } catch (error) {
        failures.push(`${asset.path}: ${error.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => checkNextAssets()));
  if (failures.length) {
    throw new Error(
      `Published asset verification failed for ${failures.length} of ${manifest.assets.length} files:\n${failures.slice(0, 12).join('\n')}`,
    );
  }
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));
  const deployment = parseDeploymentStatus();
  const message = getDeploymentMessage(deployment) ?? deploymentMessageFromWrangler();
  const deploymentWithMessage = message ? { ...deployment, message } : deployment;
  const manifest = await fetchReleaseManifest(baseUrl);
  const verified = assertDeploymentMatchesManifest(deploymentWithMessage, manifest);

  await verifyPublishedAssets(manifest, baseUrl);
  console.log(
    `Verified Worker version ${verified.versionId}: source ${verified.sourceRevision}, build ${verified.buildId}, ${verified.assetCount} static assets (${verified.assetManifestSha256}).`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`ClickPDF release verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}

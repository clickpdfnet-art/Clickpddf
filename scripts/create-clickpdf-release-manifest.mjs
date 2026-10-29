import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  RELEASE_MANIFEST_NAME,
  WRANGLER_VERSION,
  collectStaticAssetEntries,
  createReleaseManifest,
  sha256,
} from './clickpdf-release-provenance.mjs';

export async function createClickPdfReleaseManifest({ rootDirectory, sourceRevision, pnpmVersion }) {
  const publicDirectory = path.join(rootDirectory, 'artifacts/clickpdf/dist/public');
  const [lockfile, wranglerConfig] = await Promise.all([
    readFile(path.join(rootDirectory, 'pnpm-lock.yaml')),
    readFile(path.join(rootDirectory, 'wrangler.toml')),
  ]);

  if (!pnpmVersion) throw new Error('pnpmVersion is required to record the build toolchain.');

  const buildInputs = {
    nodeVersion: process.version,
    pnpmVersion,
    wranglerVersion: WRANGLER_VERSION,
    lockfileSha256: sha256(lockfile),
    wranglerConfigSha256: sha256(wranglerConfig),
  };
  const assets = await collectStaticAssetEntries(publicDirectory);
  const manifest = createReleaseManifest({ sourceRevision, assets, buildInputs });
  const outputPath = path.join(publicDirectory, RELEASE_MANIFEST_NAME);
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { manifest, outputPath };
}

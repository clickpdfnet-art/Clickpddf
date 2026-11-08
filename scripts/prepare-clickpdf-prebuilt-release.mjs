import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createPrebuiltReleaseManifest } from './clickpdf-prebuilt-release.mjs';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function gitOutput(args) {
  return execFileSync('git', args, { cwd: rootDirectory, encoding: 'utf8' }).trim();
}

async function main() {
  if (gitOutput(['status', '--porcelain', '--untracked-files=normal'])) {
    throw new Error('Refusing to prepare release provenance from a dirty Git worktree.');
  }
  const sourceRevision = gitOutput(['rev-parse', '--verify', 'HEAD']);
  const pnpmVersion = execFileSync('pnpm', ['--version'], {
    cwd: rootDirectory,
    encoding: 'utf8',
  }).trim();
  const { manifest, manifestPath } = await createPrebuiltReleaseManifest({
    rootDirectory,
    sourceRevision,
    pnpmVersion,
  });
  if (gitOutput(['status', '--porcelain', '--untracked-files=normal'])) {
    throw new Error('Source worktree changed while preparing the prebuilt release manifest.');
  }

  console.log(JSON.stringify({
    manifestPath,
    sourceRevision: manifest.sourceRevision,
    buildId: manifest.buildId,
    buildMode: manifest.buildInputs.buildMode,
    assetCount: manifest.assets.length,
    assetManifestSha256: manifest.assetManifestSha256,
    protectedFileSha256: manifest.buildInputs.protectedFileSha256,
  }, null, 2));
}

main().catch((error) => {
  console.error(`ClickPDF prebuilt release preparation failed: ${error.message}`);
  process.exitCode = 1;
});

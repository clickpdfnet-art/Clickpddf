import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClickPdfReleaseManifest } from './create-clickpdf-release-manifest.mjs';
import {
  CLICKPDF_WORKER_NAME,
  WRANGLER_VERSION,
  formatDeploymentMessage,
} from './clickpdf-release-provenance.mjs';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function gitOutput(args) {
  return execFileSync('git', args, { cwd: rootDirectory, encoding: 'utf8' }).trim();
}

function assertCleanGitTree(stage) {
  const status = gitOutput(['status', '--porcelain', '--untracked-files=normal']);
  if (status) {
    throw new Error(`Refusing to deploy: Git worktree must be clean ${stage}.`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDirectory,
    stdio: 'inherit',
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with status ${result.status ?? 'unknown'}.`);
  }
}

function capture(command, args) {
  return execFileSync(command, args, { cwd: rootDirectory, encoding: 'utf8' }).trim();
}

async function main() {
  assertCleanGitTree('before building');
  const sourceRevision = gitOutput(['rev-parse', '--verify', 'HEAD']);
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(sourceRevision)) {
    throw new Error('Could not resolve a full Git source revision.');
  }

  run('pnpm', ['run', 'build']);
  assertCleanGitTree('after building');

  const pnpmVersion = capture('pnpm', ['--version']);
  const { manifest } = await createClickPdfReleaseManifest({
    rootDirectory,
    sourceRevision,
    pnpmVersion,
  });
  const message = formatDeploymentMessage(manifest);

  // Keep account identity output private while checking that Wrangler is authenticated.
  const auth = spawnSync(
    'pnpm',
    ['dlx', `wrangler@${WRANGLER_VERSION}`, 'whoami'],
    { cwd: rootDirectory, encoding: 'utf8' },
  );
  if (auth.error || auth.status !== 0) {
    throw new Error('Cloudflare Wrangler authentication check failed; deployment was not started.');
  }

  run('pnpm', [
    'dlx',
    `wrangler@${WRANGLER_VERSION}`,
    'deploy',
    '--name',
    CLICKPDF_WORKER_NAME,
    '--strict',
    '--message',
    message,
  ]);

  run('node', ['scripts/verify-clickpdf-release.mjs']);
}

main().catch((error) => {
  console.error(`ClickPDF deployment stopped: ${error.message}`);
  process.exitCode = 1;
});

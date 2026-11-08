import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const publicDir = path.join(appDir, 'public');
const distPublicDir = path.join(appDir, 'dist', 'public');
const mode = process.env.CLICKPDF_BUILD_MODE || 'standard';
const sitemapSha256 = '5c67e14e85437cc63381ff138d344211fe0ef4260be7f0db4fb5e5708d233047';
const approvedSitemapIndexSha256 = '82a73902c844ea1162dbfeb84e263dd7afb973de9c8f59aed08a4c767bbcb2e7';
const fallbackCover =
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80';

const standardTests = [
  'scripts/test-tools-index-route.mjs',
  'scripts/test-cloudflare-tool-routes.mjs',
  'scripts/test-tool-visibility.mjs',
  'scripts/test-sitemap-counts.mjs',
  'scripts/test-sitemap-lastmod.mjs',
  'scripts/test-structured-data.mjs',
  'scripts/test-sitemap-index.mjs',
  'scripts/test-tool-privacy-copy.mjs',
  'scripts/test-tool-seo-audit.mjs',
  'scripts/test-localized-tool-seo.mjs',
  'scripts/test-additional-tool-engines.mjs',
  'scripts/test-adsense-integration.mjs',
];

const preserveTests = [
  ...standardTests.filter((testFile) => testFile !== 'scripts/test-sitemap-lastmod.mjs'),
  'scripts/test-sitemap-preserve-mode.mjs',
  'scripts/test-merge-pdf-regression.mjs',
  'scripts/test-pdf-background-regression.mjs',
];

const protectedFiles = [
  {
    name: 'sitemap.xml',
    expectedSha256: sitemapSha256,
  },
  {
    name: 'llms.txt',
    envName: 'CLICKPDF_PRESERVE_LLMS_SHA256',
    expectedSha256: 'df8a51ef3130d30caa5d6e7a6c53956f9340e162790c29c9a27e71a1dbc92ca0',
  },
  {
    name: 'llms-full.txt',
    envName: 'CLICKPDF_PRESERVE_LLMS_FULL_SHA256',
    expectedSha256: '8652b42d296f487703434ef341904423791ed69d70e335bd7be3c07c48bb155a',
  },
];

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function requireApprovedHash(envName, expectedSha256) {
  const value = process.env[envName]?.trim().toLowerCase();
  if (!value || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(
      `Preserve Mode requires an owner-approved 64-character SHA-256 in ${envName}.`,
    );
  }
  if (expectedSha256 && value !== expectedSha256) {
    throw new Error(
      `Preserve Mode requires ${envName} to match the owner-approved baseline.`,
    );
  }
  return value;
}

function requireApprovedSitemapIndexHash() {
  const envName = 'CLICKPDF_PRESERVE_SITEMAP_INDEX_SHA256';
  const value = process.env[envName]?.trim().toLowerCase();
  const actualStatus = !value
    ? 'missing'
    : !/^[a-f0-9]{64}$/.test(value)
      ? 'invalid SHA-256 format'
      : value !== approvedSitemapIndexSha256
        ? 'does not match the owner-approved baseline'
        : 'approved';
  if (actualStatus !== 'approved') {
    throw new Error(
      `Protected output dist/public/sitemap_index.xml requires ${envName}; expected status: the owner-approved baseline is supplied; actual status: ${actualStatus}.`,
    );
  }
  return approvedSitemapIndexSha256;
}

async function assertSitemapIndexUnchanged(expectedHash, stage) {
  const outputPath = path.join(distPublicDir, 'sitemap_index.xml');
  let contents;
  try {
    contents = await readFile(outputPath);
  } catch (error) {
    const actualStatus = error.code === 'ENOENT'
      ? 'missing'
      : `unreadable (${error.code || 'read failure'})`;
    throw new Error(
      `Protected output dist/public/sitemap_index.xml ${stage}; expected status: approved SHA-256 match; actual status: ${actualStatus}.`,
    );
  }

  const actualHash = sha256(contents);
  if (actualHash !== expectedHash) {
    throw new Error(
      `Protected output dist/public/sitemap_index.xml ${stage}; expected status: approved SHA-256 match; actual status: hash mismatch.`,
    );
  }
}

async function captureApprovedProtectedHashes() {
  const hashes = new Map();
  for (const file of protectedFiles) {
    const expected = file.expectedSha256;
    if (!expected || !/^[a-f0-9]{64}$/.test(expected)) {
      throw new Error(`Protected public/${file.name} has no valid pinned SHA-256 baseline.`);
    }
    if (file.envName) requireApprovedHash(file.envName, expected);
    const sourcePath = path.join(publicDir, file.name);
    const actual = sha256(await readFile(sourcePath));
    if (actual !== expected) {
      throw new Error(
        `Protected public/${file.name} does not match its approved SHA-256; stopping before build.`,
      );
    }
    hashes.set(file.name, expected);
  }
  return hashes;
}

function unquoteYamlScalar(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseWatermarkFrontmatter(markdown) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return {};
  return Object.fromEntries(frontmatter[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(':');
    if (separator < 1) return [];
    const normalizedKey = line
      .slice(0, separator)
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    const value = unquoteYamlScalar(line.slice(separator + 1));
    return [[normalizedKey, value]];
  }));
}

function frontmatterValue(markdown, key) {
  const normalizedKey = key.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return parseWatermarkFrontmatter(markdown)[normalizedKey];
}

async function assertMappedAssetExists(source, mappedPath, publicRealPath) {
  if (
    typeof mappedPath !== 'string' ||
    !mappedPath.startsWith('/') ||
    mappedPath.startsWith('//')
  ) {
    throw new Error(`Invalid local watermark asset mapping for blog cover: ${source}`);
  }

  const candidate = path.resolve(publicDir, mappedPath.slice(1));
  const relative = path.relative(publicDir, candidate);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Watermark asset mapping escapes public/: ${mappedPath}`);
  }

  let realCandidate;
  try {
    realCandidate = await realpath(candidate);
  } catch {
    throw new Error(`Required pre-generated blog watermark is missing: ${mappedPath}`);
  }
  const realRelative = path.relative(publicRealPath, realCandidate);
  if (!realRelative || realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
    throw new Error(`Watermark asset resolves outside public/: ${mappedPath}`);
  }
  if (!(await stat(realCandidate)).isFile()) {
    throw new Error(`Required blog watermark is not a file: ${mappedPath}`);
  }
}

async function verifyExistingBlogWatermarkAssets() {
  const mapPath = path.join(appDir, 'src', 'data', 'blogWatermarkMap.json');
  const blogDir = path.join(appDir, 'src', 'blogs');
  let watermarkMap;
  try {
    watermarkMap = JSON.parse(await readFile(mapPath, 'utf8'));
  } catch {
    throw new Error('Existing blogWatermarkMap.json is missing or invalid; refusing to generate assets.');
  }
  if (!watermarkMap || typeof watermarkMap !== 'object' || Array.isArray(watermarkMap)) {
    throw new Error('Existing blogWatermarkMap.json must contain an object.');
  }

  const sources = new Set([fallbackCover]);
  for (const fileName of (await readdir(blogDir)).filter((name) => name.endsWith('.md'))) {
    const markdown = await readFile(path.join(blogDir, fileName), 'utf8');
    sources.add(
      frontmatterValue(markdown, 'coverimage') ||
        frontmatterValue(markdown, 'image') ||
        fallbackCover,
    );
  }

  const publicRealPath = await realpath(publicDir);
  for (const source of sources) {
    const mappedPath = watermarkMap[source];
    if (!mappedPath) {
      throw new Error(`Blog watermark map has no existing entry for a required cover: ${source}`);
    }
    await assertMappedAssetExists(source, mappedPath, publicRealPath);
  }
}

async function assertProtectedFilesUnchanged(expectedHashes, { requireDistCopy = false } = {}) {
  for (const [name, expected] of expectedHashes) {
    const sourcePath = path.join(publicDir, name);
    if (sha256(await readFile(sourcePath)) !== expected) {
      throw new Error(`Protected source file public/${name} changed; stopping safely.`);
    }

    if (requireDistCopy) {
      const distPath = path.join(distPublicDir, name);
      if (sha256(await readFile(distPath)) !== expected) {
        throw new Error(`Protected output file dist/public/${name} is missing or changed.`);
      }
    }
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: appDir,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const error = new Error(`${command} ${args.join(' ')} exited with status ${result.status ?? 'unknown'}.`);
    error.exitCode = result.status || 1;
    throw error;
  }
}

function runNode(args) {
  run(process.execPath, args);
}

async function inspectProtectedSourcesAfterFailure(expectedHashes) {
  const results = [];
  for (const [name, expected] of expectedHashes) {
    try {
      const actual = sha256(await readFile(path.join(publicDir, name)));
      results.push({ name, expected, actual, unchanged: actual === expected });
    } catch (error) {
      results.push({
        name,
        expected,
        actual: `UNREADABLE (${error.code || error.message})`,
        unchanged: false,
      });
    }
  }
  return results;
}

function formatPostFailureIntegrity(results) {
  const changed = results.filter((result) => !result.unchanged);
  if (changed.length === 0) {
    return `Post-failure protected source SHA-256 check: unchanged (${results
      .map(({ name, actual }) => `public/${name}=${actual}`)
      .join('; ')}).`;
  }
  return `Post-failure protected source integrity failure:\n${changed
    .map(({ name, expected, actual }) =>
      `- public/${name}: expected SHA-256 ${expected}; actual SHA-256 ${actual}`,
    )
    .join('\n')}`;
}

async function runPreserveCommand(command, args, expectedHashes) {
  try {
    run(command, args);
  } catch (originalError) {
    let integrityEvidence;
    try {
      const results = await inspectProtectedSourcesAfterFailure(expectedHashes);
      integrityEvidence = formatPostFailureIntegrity(results);
    } catch (checkError) {
      integrityEvidence =
        `Post-failure protected source SHA-256 check could not complete: ${checkError.message}`;
    }
    originalError.message = `${originalError.message}\n${integrityEvidence}`;
    throw originalError;
  }
}

async function runPreserveNode(args, expectedHashes) {
  await runPreserveCommand(process.execPath, args, expectedHashes);
}

async function runStandardBuild() {
  runNode(['scripts/generate-blog-watermarks.mjs']);
  runNode(['scripts/generate-additional-tool-seo-drafts.mjs']);
  runNode(['scripts/generate-blog-sitemap.mjs']);
  run('vite', ['build', '--config', 'vite.config.ts']);
  runNode(['scripts/generate-structured-data-pages.mjs']);
  runNode(['scripts/generate-sitemap-index.mjs']);
  runNode(['--test', ...standardTests]);
}

async function runSitemapPreservingBuild() {
  const approvedSitemapIndexHash = requireApprovedSitemapIndexHash();
  await assertSitemapIndexUnchanged(approvedSitemapIndexHash, 'before build');
  const approvedHashes = await captureApprovedProtectedHashes();
  await verifyExistingBlogWatermarkAssets();

  // The three source-writing generators are intentionally omitted in this mode.
  try {
    await runPreserveCommand('vite', ['build', '--config', 'vite.config.ts'], approvedHashes);
    await runPreserveNode(['scripts/generate-structured-data-pages.mjs'], approvedHashes);
    await runPreserveNode(['scripts/generate-sitemap-index.mjs'], approvedHashes);
  } catch (error) {
    try {
      await assertSitemapIndexUnchanged(approvedSitemapIndexHash, 'after an interrupted build');
    } catch (integrityError) {
      error.message = `${error.message}\n${integrityError.message}`;
    }
    throw error;
  }
  await assertSitemapIndexUnchanged(approvedSitemapIndexHash, 'after build');
  await assertProtectedFilesUnchanged(approvedHashes, { requireDistCopy: true });

  try {
    await runPreserveNode(['--test', ...preserveTests], approvedHashes);
  } catch (error) {
    try {
      await assertSitemapIndexUnchanged(approvedSitemapIndexHash, 'after failed Preserve Build tests');
    } catch (integrityError) {
      error.message = `${error.message}\n${integrityError.message}`;
    }
    throw error;
  }
  await assertSitemapIndexUnchanged(approvedSitemapIndexHash, 'after Preserve Build tests');
  await assertProtectedFilesUnchanged(approvedHashes, { requireDistCopy: true });
}

async function main() {
  if (mode === 'standard') {
    await runStandardBuild();
    return;
  }
  if (mode === 'sitemap-preserving') {
    await runSitemapPreservingBuild();
    return;
  }
  throw new Error(
    `Unsupported CLICKPDF_BUILD_MODE "${mode}". Use "standard" or "sitemap-preserving".`,
  );
}

main().catch((error) => {
  console.error(`ClickPDF ${mode} build failed: ${error.message}`);
  process.exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
});

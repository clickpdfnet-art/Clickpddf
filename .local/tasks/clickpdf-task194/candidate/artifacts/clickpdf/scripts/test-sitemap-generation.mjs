import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRestoredToolPages } from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public', 'sitemap.xml');
const distSitemapPath = path.join(appDir, 'dist', 'public', 'sitemap.xml');
const baselinePath = path.join(scriptDir, 'fixtures', 'task198-sitemap-baseline.json');
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const { pages, englishPages, sitemapPages } = await readRestoredToolPages(appDir);

function parseEntries(sitemap) {
  const blocks = [...sitemap.matchAll(/<url\b[\s\S]*?<\/url>/gi)].map((match) => match[0]);
  return blocks.map((block) => {
    const loc = block.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i)?.[1]?.trim();
    assert.ok(loc, 'each sitemap URL block has a loc');
    const alternates = [...block.matchAll(
      /<xhtml:link\b[^>]*\bhreflang="([^"]+)"[^>]*\bhref="([^"]+)"[^>]*\/>/gi,
    )].map((match) => ({ hreflang: match[1], href: match[2] }));
    return { loc, alternates };
  });
}

async function snapshotSitemap() {
  const content = await readFile(sitemapPath, 'utf8');
  const physicalLines = content.split(/\r?\n/);
  if (physicalLines.at(-1) === '') physicalLines.pop();
  const entries = parseEntries(content);
  return {
    content,
    entries,
    blankLines: physicalLines.filter((line) => !line.trim()).length,
  };
}

async function findToolHtmlFiles(directory, relative = '') {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) return findToolHtmlFiles(directory, child);
    if (entry.isFile() && entry.name === 'index.html' && child.split(path.sep).includes('tools')) {
      return [child];
    }
    return [];
  }));
  return nested.flat();
}

assert.equal(baseline.task, 198);
assert.equal(baseline.baselineBlankLines, 738, 'the recorded pre-change sitemap had 738 blank lines');
assert.equal(baseline.locCount, 140);
assert.equal(baseline.uniqueLocCount, 140);
assert.equal(baseline.entriesWithAlternates, 123);
assert.equal(baseline.alternateLinkCount, 1308);
assert.equal(baseline.expectedStaticToolHtmlPages, 123);
assert.equal(sitemapPages.length, 123);
assert.equal(pages.length + englishPages.length, 123);

const before = await snapshotSitemap();
assert.deepEqual(before.entries, baseline.entries, 'ordered sitemap locs and every hreflang alternate match the pre-change baseline');
assert.equal(before.entries.length, 140);
assert.equal(new Set(before.entries.map((entry) => entry.loc)).size, 140);
assert.equal(before.entries.reduce((sum, entry) => sum + entry.alternates.length, 0), 1308);
assert.equal(before.blankLines, 0, 'normalized sitemap output contains no repeated blank lines');
assert.match(
  before.content,
  /Total sitemap URLs: 140; canonical tool URL entries: 123; public tools: 25; static tool HTML pages: 123 \(100 scoped locale pages \+ 23 English routes\)\./,
);

const staticToolHtmlFiles = await findToolHtmlFiles(path.join(appDir, 'dist', 'public'));
assert.equal(staticToolHtmlFiles.length, 123, 'built output contains 123 static tool HTML pages');
assert.equal(await readFile(distSitemapPath, 'utf8'), before.content, 'Vite output sitemap matches the generated public sitemap');

execFileSync(process.execPath, [path.join(scriptDir, 'generate-restored-tool-sitemap.mjs')], {
  cwd: appDir,
  stdio: 'pipe',
});
const after = await snapshotSitemap();
assert.equal(after.content, before.content, 'a repeated sitemap generation pass is byte-for-byte idempotent');
assert.deepEqual(after.entries, before.entries, 'ordered locs and hreflang alternates are unchanged on repetition');
assert.equal(after.blankLines, 0, 'repeated generation does not add blank lines');
assert.equal(
  createHash('sha256').update(JSON.stringify(after.entries)).digest('hex'),
  baseline.orderedLocAndHreflangSha256,
  'the exact ordered loc/hreflang data matches the saved baseline digest',
);

console.log(
  `PASS: sitemap URLs/alternates match the 140-entry baseline in order; ` +
  `123 static tool HTML files; blank lines ${baseline.baselineBlankLines} -> ${after.blankLines}; ` +
  'repeat generation is byte-for-byte idempotent.',
);

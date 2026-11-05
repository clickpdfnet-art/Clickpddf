import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  getSitemapContentDates,
  normalizeContentDate,
} from './sitemap-content-dates.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public/sitemap.xml');
const blogDir = path.join(appDir, 'src/blogs');
const sitemap = await readFile(sitemapPath, 'utf8');
const urlBlocks = sitemap.match(/  <url>[\s\S]*?<\/url>/g) || [];

function frontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(':');
    if (separator <= 0) return [];
    const key = line.slice(0, separator).trim().toLowerCase().replace(/[\s_-]+/g, '');
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return [[key, value]];
  }));
}

function articlePath(meta) {
  const candidate = typeof meta.routepath === 'string' ? meta.routepath.trim() : '';
  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !/[?#]/.test(candidate) &&
    !candidate.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    return `/${candidate.split('/').filter(Boolean).join('/')}/`;
  }
  return `/blog/${encodeURIComponent(meta.slug)}/`;
}

function urlLocations(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
}

function hreflangPairs(xml) {
  const blocks = xml.match(/  <url>[\s\S]*?<\/url>/g) || [];
  return blocks.flatMap((block) => {
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    return [...block.matchAll(
      /<xhtml:link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/>/g,
    )].map((match) => `${loc}\t${match[1]}\t${match[2]}`);
  }).sort();
}

test('sitemap content dates come from source modifications, never build time', async () => {
  assert.throws(() => normalizeContentDate('', 'test article'), /Missing content modification date/);
  assert.throws(() => normalizeContentDate('not-a-date', 'test article'), /Invalid content modification date/);
  assert.equal(normalizeContentDate('2026-10-27', 'test article'), '2026-10-27');

  const sourceDates = await getSitemapContentDates(appDir);
  const [again] = await Promise.all([getSitemapContentDates(appDir)]);
  assert.deepEqual(again, sourceDates, 'committed content dates are deterministic');

  const toolBlocks = urlBlocks.filter((block) =>
    /<loc>https:\/\/www\.clickpdf\.net\/(?:[a-z]{2}\/)?tools\//.test(block),
  );
  assert.equal(toolBlocks.length, 526, 'all current tool routes and the catalog remain present');
  for (const block of toolBlocks) {
    assert.match(block, new RegExp(`<lastmod>${sourceDates.tools}</lastmod>`));
  }

  const utilityDates = new Map([
    ['https://www.clickpdf.net/faq/', sourceDates.faq],
    ['https://www.clickpdf.net/batch/', sourceDates.batch],
    ...JSON.parse(await readFile(path.join(appDir, 'src/data/legalPages.json'), 'utf8'))
      .map((page) => [`https://www.clickpdf.net${page.path}`, sourceDates.legal]),
  ]);
  for (const [url, expectedDate] of utilityDates) {
    const block = urlBlocks.find((entry) => entry.includes(`<loc>${url}</loc>`));
    assert.ok(block, `utility sitemap entry exists: ${url}`);
    assert.match(block, new RegExp(`<lastmod>${expectedDate}</lastmod>`));
  }

  const blogDates = new Map();
  for (const name of await readdir(blogDir)) {
    if (!name.endsWith('.md')) continue;
    const meta = frontmatter(await readFile(path.join(blogDir, name), 'utf8'));
    if (!meta.slug || !meta.title) continue;
    blogDates.set(
      `https://www.clickpdf.net${articlePath(meta)}`,
      normalizeContentDate(meta.datemodified || meta.date, `${name} frontmatter`),
    );
  }
  const generatedBlogBlocks = urlBlocks.filter((block) =>
    /<changefreq>monthly<\/changefreq>/.test(block),
  );
  assert.equal(generatedBlogBlocks.length, blogDates.size, 'every Markdown article has one sitemap entry');
  for (const block of generatedBlogBlocks) {
    const url = block.match(/<loc>([\s\S]*?)<\/loc>/)?.[1]?.trim();
    assert.equal(blogDates.get(url), block.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1]);
  }
});

test('lastmod correction preserves the current sitemap URL and hreflang surface', () => {
  const locations = urlLocations(sitemap);
  const alternates = hreflangPairs(sitemap);
  const hash = (items) => createHash('sha256').update(items.join('\n')).digest('hex');

  assert.equal(locations.length, 767);
  assert.equal(new Set(locations).size, locations.length);
  assert.equal(
    hash(locations),
    '91a150fbe7ede037a4b71ad31d16d009a3f2f7223a1c612e83c10be828923992',
    'all sitemap URL entries and their order remain unchanged',
  );
  assert.equal(alternates.length, 16632);
  assert.equal(
    hash(alternates),
    '060b1ae94b74554d0f76b32638972b070fc181417ad8b23860f3d2044b500053',
    'all hreflang links remain unchanged',
  );
  assert.ok(locations.every((location) => new URL(location).origin === 'https://www.clickpdf.net'));
  const locationSet = new Set(locations);
  for (const pair of alternates) {
    const target = pair.split('\t')[2];
    assert.ok(locationSet.has(target), `hreflang target is present in sitemap: ${target}`);
  }
});

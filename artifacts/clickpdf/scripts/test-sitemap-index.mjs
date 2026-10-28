import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  discoverIndividualSitemaps,
  generateSitemapIndex,
  sitemapPublicUrl,
} from './generate-sitemap-index.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const publicDir = path.join(appDir, 'dist', 'public');
const siteOrigin = 'https://www.clickpdf.net';
const sitemapNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';

function decodeXml(value) {
  return value.replace(/&(amp|lt|gt|quot|apos);/g, (_match, entity) => ({
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
  })[entity]);
}

function readIndexEntries(xml) {
  const root = xml.match(
    /^<\?xml version="1\.0" encoding="UTF-8"\?>\s*<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">([\s\S]*?)<\/sitemapindex>\s*$/,
  );
  assert.ok(root, 'index has an XML declaration and the sitemap index namespace');

  const innerXml = root[1];
  const entries = [...innerXml.matchAll(
    /<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/sitemap>/g,
  )];
  let remainder = innerXml;
  for (const entry of entries) remainder = remainder.replace(entry[0], '');
  assert.equal(remainder.trim(), '', 'index contains only sitemap entries');
  return entries.map((entry) => ({
    loc: decodeXml(entry[1]),
    lastmod: entry[2] || null,
  }));
}

test('production sitemap index lists each generated sitemap once with canonical absolute URLs', async () => {
  const xml = await readFile(path.join(publicDir, 'sitemap_index.xml'), 'utf8');
  const entries = readIndexEntries(xml);
  const sitemapFiles = await discoverIndividualSitemaps(publicDir);
  const expectedUrls = sitemapFiles.map((file) => sitemapPublicUrl(file, siteOrigin));
  const locations = entries.map((entry) => entry.loc);
  const htmlTemplate = await readFile(path.join(appDir, 'index.html'), 'utf8');

  assert.ok(entries.length > 0, 'index is not empty');
  assert.deepEqual(locations, expectedUrls, 'every individual sitemap is included in sorted order');
  assert.equal(new Set(locations).size, locations.length, 'sitemap locations are unique');
  assert.match(
    htmlTemplate,
    /<link rel="sitemap"[^>]*href="%BASE_URL%sitemap_index\.xml"/i,
    'HTML sitemap discovery points to the master index',
  );
  for (const entry of entries) {
    const url = new URL(entry.loc);
    assert.equal(url.origin, siteOrigin, 'sitemap uses the production canonical host');
    assert.equal(url.protocol, 'https:', 'sitemap URLs use HTTPS');
    if (entry.lastmod) assert.match(entry.lastmod, /^\d{4}-\d{2}-\d{2}(?:T.*Z)?$/);
  }
  assert.ok(Buffer.byteLength(xml, 'utf8') <= 50 * 1024 * 1024, 'index stays below the 50 MB limit');
  assert.ok(entries.length <= 50_000, 'index stays below the 50,000 sitemap limit');
});

test('index generation discovers added sitemaps and removes deleted references', async () => {
  const tempPublicDir = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-sitemap-index-'));
  const validSitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>\n';

  try {
    await writeFile(path.join(tempPublicDir, 'sitemap.xml'), validSitemap, 'utf8');
    await writeFile(path.join(tempPublicDir, 'sitemap_index.xml'), '<old index reference>', 'utf8');

    let generated = await generateSitemapIndex({ publicDir: tempPublicDir, siteOrigin });
    assert.deepEqual(readIndexEntries(generated.xml).map(({ loc }) => loc), [
      `${siteOrigin}/sitemap.xml`,
    ]);

    await mkdir(path.join(tempPublicDir, 'nested'), { recursive: true });
    await writeFile(path.join(tempPublicDir, 'nested', 'sitemap-blog.xml'), validSitemap, 'utf8');
    generated = await generateSitemapIndex({ publicDir: tempPublicDir, siteOrigin });
    assert.deepEqual(readIndexEntries(generated.xml).map(({ loc }) => loc), [
      `${siteOrigin}/nested/sitemap-blog.xml`,
      `${siteOrigin}/sitemap.xml`,
    ]);

    await unlink(path.join(tempPublicDir, 'nested', 'sitemap-blog.xml'));
    await writeFile(path.join(tempPublicDir, 'sitemap-tools.xml'), validSitemap, 'utf8');
    generated = await generateSitemapIndex({ publicDir: tempPublicDir, siteOrigin });
    assert.deepEqual(readIndexEntries(generated.xml).map(({ loc }) => loc), [
      `${siteOrigin}/sitemap-tools.xml`,
      `${siteOrigin}/sitemap.xml`,
    ]);
    assert.doesNotMatch(generated.xml, /nested\/sitemap-blog\.xml/);
  } finally {
    await rm(tempPublicDir, { recursive: true, force: true });
  }
});

test('index discovery rejects invalid sitemap candidates and unsafe origins', async () => {
  const tempPublicDir = await mkdtemp(path.join(os.tmpdir(), 'clickpdf-invalid-sitemap-'));
  try {
    await writeFile(path.join(tempPublicDir, 'sitemap.xml'), '<html>not a sitemap</html>', 'utf8');
    await assert.rejects(
      () => discoverIndividualSitemaps(tempPublicDir),
      /not a URL-set sitemap/,
    );
    await assert.rejects(
      () => generateSitemapIndex({ publicDir: tempPublicDir, siteOrigin: 'http://clickpdf.net' }),
      /Expected an HTTPS site origin/,
    );
  } finally {
    await rm(tempPublicDir, { recursive: true, force: true });
  }
});


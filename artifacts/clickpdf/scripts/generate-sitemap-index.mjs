import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const defaultPublicDir = path.join(appDir, 'dist', 'public');
const masterIndexName = 'sitemap_index.xml';
const sitemapFilePattern = /^sitemap(?:[-_][a-z0-9][a-z0-9._-]*)?\.xml$/i;
const sitemapIndexPattern = /^sitemap[-_]?index(?:[-_].*)?\.xml$/i;
const sitemapNamespace = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const defaultSiteOrigin = 'https://www.clickpdf.net';
const maxSitemapEntries = 50_000;
const maxIndexBytes = 50 * 1024 * 1024;

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function canonicalOrigin(siteOrigin) {
  const parsed = new URL(siteOrigin);
  if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`Expected an HTTPS site origin without a path, query, or fragment: ${siteOrigin}`);
  }
  return parsed.origin;
}

export function sitemapPublicUrl(relativePath, siteOrigin = defaultSiteOrigin) {
  const origin = canonicalOrigin(siteOrigin);
  const encodedPath = relativePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return new URL(encodedPath, `${origin}/`).toString();
}

export async function discoverIndividualSitemaps(publicDir) {
  const found = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }
      if (!entry.isFile() || !sitemapFilePattern.test(entry.name)) continue;
      if (sitemapIndexPattern.test(entry.name)) continue;

      const xml = await readFile(filePath, 'utf8');
      if (/<sitemapindex\b/i.test(xml)) continue;
      if (!/<urlset\b/i.test(xml)) {
        throw new Error(`Sitemap candidate is not a URL-set sitemap: ${filePath}`);
      }

      found.push(path.relative(publicDir, filePath));
    }
  }

  await visit(publicDir);
  return found.sort((left, right) => left.localeCompare(right));
}

export async function generateSitemapIndex({
  publicDir = defaultPublicDir,
  siteOrigin = defaultSiteOrigin,
} = {}) {
  const origin = canonicalOrigin(siteOrigin);
  const sitemapFiles = await discoverIndividualSitemaps(publicDir);

  if (sitemapFiles.length === 0) {
    throw new Error(`No individual sitemap XML files were found in ${publicDir}`);
  }
  if (sitemapFiles.length > maxSitemapEntries) {
    throw new Error(
      `Found ${sitemapFiles.length} individual sitemaps; the sitemap index limit is ${maxSitemapEntries}.`,
    );
  }

  const entries = sitemapFiles.map((relativePath) => {
    const loc = sitemapPublicUrl(relativePath, origin);
    return `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>\n  </sitemap>`;
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sitemapindex xmlns="${sitemapNamespace}">`,
    ...entries,
    '</sitemapindex>',
    '',
  ].join('\n');

  if (Buffer.byteLength(xml, 'utf8') > maxIndexBytes) {
    throw new Error(`Generated sitemap index exceeds the ${maxIndexBytes}-byte uncompressed limit.`);
  }

  await writeFile(path.join(publicDir, masterIndexName), xml, 'utf8');
  return { xml, sitemapFiles, path: path.join(publicDir, masterIndexName) };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await generateSitemapIndex();
  console.log(
    `Generated ${result.path} with ${result.sitemapFiles.length} individual sitemap file(s).`,
  );
}

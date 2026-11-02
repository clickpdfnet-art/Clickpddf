import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRestoredToolPages, SITE_ORIGIN } from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const sitemapPath = path.join(appDir, 'public', 'sitemap.xml');
const qaLedgerPath = path.join(appDir, 'src', 'data', 'restoredToolSeoQa.json');
const { pages, englishPages, sitemapPages } = await readRestoredToolPages(appDir);
const publicToolCount = new Set(sitemapPages.map((page) => page.toolId)).size;
const staticToolHtmlPageCount = pages.length + englishPages.length;

function getLoc(block) {
  return block.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i)?.[1]?.trim() ?? '';
}

function isTargetUrl(value) {
  try {
    const pathname = new URL(value).pathname.replace(/\/+$/, '');
    return sitemapPages.some((page) => pathname === page.canonical.replace(SITE_ORIGIN, '').replace(/\/+$/, ''));
  } catch {
    return false;
  }
}

function renderUrlBlock(page) {
  const routeForLocale = (locale) => locale === 'en'
    ? `${SITE_ORIGIN}/tools/${page.slug}/`
    : `${SITE_ORIGIN}/${locale}/tools/${page.slug}/`;
  const alternates = page.alternateLocales
    .map((locale) => {
      return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${routeForLocale(locale)}" />`;
    })
    .join('\n');
  return [
    '  <url>',
    `    <loc>${page.canonical}</loc>`,
    alternates,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${routeForLocale('en')}" />`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
  ].join('\n');
}

const originalSitemap = await readFile(sitemapPath, 'utf8');
const blocks = originalSitemap.match(/<url\b[\s\S]*?<\/url>/gi) ?? [];
const retained = blocks.filter((block) => !isTargetUrl(getLoc(block)));
const targetBlocks = sitemapPages.map(renderUrlBlock);
const totalUrls = retained.length + targetBlocks.length;
const urlsetMatch = originalSitemap.match(/<urlset\b[^>]*>/i);
if (!urlsetMatch || !originalSitemap.includes('</urlset>')) {
  throw new Error('Could not find a complete sitemap urlset element.');
}
const xmlPreamble = originalSitemap.slice(0, urlsetMatch.index).trim();
let urlsetOpenTag = urlsetMatch[0];
if (!/\bxmlns:xhtml=/.test(urlsetOpenTag)) {
  urlsetOpenTag = urlsetOpenTag.replace(/>$/, ' xmlns:xhtml="http://www.w3.org/1999/xhtml">');
}
const preservedComments = [...originalSitemap.matchAll(/<!--[\s\S]*?-->/g)]
  .map((match) => match[0].trim())
  .filter((comment) => !/<!--\s*Total(?:\s+sitemap)? URLs:/i.test(comment));
const sitemapComment =
  `<!-- Total sitemap URLs: ${totalUrls}; canonical tool URL entries: ${targetBlocks.length}; ` +
  `public tools: ${publicToolCount}; static tool HTML pages: ${staticToolHtmlPageCount} ` +
  `(${pages.length} scoped locale pages + ${englishPages.length} English routes). -->`;
const sitemap = [
  xmlPreamble,
  urlsetOpenTag,
  ...preservedComments,
  sitemapComment,
  ...retained.map((block) => block.trim()),
  ...targetBlocks,
  '</urlset>',
].filter(Boolean).join('\n') + '\n';

const targetLocs = targetBlocks.map(getLoc);
if (new Set(targetLocs).size !== targetLocs.length || targetLocs.length !== 123) {
  throw new Error(`Expected 123 canonical sitemap URLs; generated ${targetLocs.length}.`);
}
if (staticToolHtmlPageCount !== 123) {
  throw new Error(`Expected 123 static tool HTML pages; found ${staticToolHtmlPageCount}.`);
}
await writeFile(sitemapPath, sitemap);
const qaEntries = pages
  .filter((page) => page.locale !== 'en')
  .map((page) => ({
    locale: page.locale,
    tool: page.toolId,
    status: 'generated_draft',
    humanReviewed: false,
    reviewer: null,
  }));
await writeFile(
  qaLedgerPath,
  `${JSON.stringify({
    baseSourceSha: '3631f75badc8ba1fe0533d2f3489269adfbfa748',
    entries: qaEntries,
  }, null, 2)}\n`,
);
console.log(
  `Updated sitemap: ${totalUrls} total sitemap URLs; ${targetLocs.length} canonical tool URL entries; ` +
  `${staticToolHtmlPageCount} static tool HTML pages (${pages.length} scoped locale pages + ${englishPages.length} English routes).`,
);
console.log(`Recorded ${qaEntries.length} translations as unreviewed drafts.`);

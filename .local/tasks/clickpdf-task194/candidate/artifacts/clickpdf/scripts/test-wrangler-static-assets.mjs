import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRestoredToolPages } from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const origin = new URL(process.env.TASK194_WRANGLER_ORIGIN || 'http://127.0.0.1:8787');
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname),
  'Wrangler asset verification is restricted to a local loopback server',
);

const { pages, englishPages, sitemapPages } = await readRestoredToolPages(appDir);
const staticPages = [...pages, ...englishPages];
const rootIndex = await readFile(path.join(appDir, 'dist', 'public', 'index.html'), 'utf8');
const expectedRoutes = JSON.parse(await readFile(
  path.join(scriptDir, 'fixtures', 'task197-expected-english-routes.json'),
  'utf8',
));
const actualEnglishRoutes = englishPages.map((page) => page.canonical).sort();
const expectedEnglishRoutes = [...expectedRoutes.routes].sort();
assert.equal(expectedRoutes.baseSourceSha, '3631f75badc8ba1fe0533d2f3489269adfbfa748');
assert.equal(englishPages.length, 23);
assert.deepEqual(actualEnglishRoutes, expectedEnglishRoutes, 'the candidate still targets the exact 23 approved English routes');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const getAttribute = (source, name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return source.match(new RegExp(`\\b${escapedName}=["']([^"']*)["']`, 'i'))?.[1] ?? null;
};
const getMetaContent = (html, attrName, attrValue) => {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (getAttribute(match[0], attrName) === attrValue) return getAttribute(match[0], 'content');
  }
  return null;
};
const getCanonical = (html) => {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (getAttribute(match[0], 'rel') === 'canonical') return getAttribute(match[0], 'href');
  }
  return null;
};
const getHreflangCodes = (html) => [...html.matchAll(/<link\b[^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => getAttribute(tag, 'rel') === 'alternate')
  .map((tag) => getAttribute(tag, 'hreflang'))
  .sort();

const englishHtmlByCanonical = new Map();
const englishStatusByCanonical = new Map();
for (const page of staticPages) {
  const response = await fetch(new URL(new URL(page.canonical).pathname, origin), { redirect: 'manual' });
  assert.equal(response.status, 200, `${page.canonical} returns HTTP 200 through Wrangler assets`);
  assert.equal(response.redirected, false, `${page.canonical} is served directly without redirecting`);
  assert.match(response.headers.get('content-type') || '', /text\/html/i);
  const html = await response.text();
  assert.ok(html.includes(`<title>${escapeHtml(page.seoTitle)} | ClickPDF</title>`));
  assert.equal(getCanonical(html), page.canonical);
  assert.ok(html.includes('id="seo-static-content"'));
  if (page.locale === 'en' && page.toolSeo) {
    englishHtmlByCanonical.set(page.canonical, html);
    englishStatusByCanonical.set(page.canonical, response.status);
  }
}

const homeTitle = rootIndex.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '';
const uniqueTitles = new Set();
for (const page of englishPages) {
  const html = englishHtmlByCanonical.get(page.canonical);
  assert.ok(html, `${page.canonical} was fetched directly as a static route`);
  assert.notEqual(html, rootIndex, `${page.canonical} is not the homepage shell`);
  const expectedTitle = `${page.seoTitle} | ClickPDF`;
  uniqueTitles.add(expectedTitle);
  assert.ok(html.includes(`<title>${escapeHtml(expectedTitle)}</title>`));
  assert.ok(html.includes(`<h1 id="seo-tool-title">${escapeHtml(page.title)}</h1>`));
  assert.equal(getMetaContent(html, 'name', 'description'), escapeHtml(page.description));
  assert.equal(getMetaContent(html, 'name', 'robots'), 'index,follow');
  assert.equal(getMetaContent(html, 'name', 'keywords'), escapeHtml(page.keywords));
  assert.equal(getCanonical(html), page.canonical);
  assert.equal(getMetaContent(html, 'property', 'og:title'), escapeHtml(expectedTitle));
  assert.equal(getMetaContent(html, 'property', 'og:description'), escapeHtml(page.description));
  assert.equal(getMetaContent(html, 'property', 'og:url'), page.canonical);
  assert.equal(getMetaContent(html, 'property', 'og:type'), 'website');
  assert.equal(getMetaContent(html, 'property', 'og:image'), escapeHtml(page.ogImage));
  assert.equal(getMetaContent(html, 'name', 'twitter:title'), escapeHtml(expectedTitle));
  assert.equal(getMetaContent(html, 'name', 'twitter:description'), escapeHtml(page.description));
  assert.equal(getMetaContent(html, 'name', 'twitter:card'), 'summary_large_image');
  assert.equal(getMetaContent(html, 'name', 'twitter:image'), escapeHtml(page.ogImage));
  assert.notEqual(expectedTitle, homeTitle, `${page.canonical} has a route-specific title rather than homepage metadata`);
  assert.match(html, /<html\b[^>]*\blang="en"[^>]*\bdir="ltr"/i);

  const expectedHreflangs = [...page.alternateLocales, 'x-default'].sort();
  assert.deepEqual(getHreflangCodes(html), expectedHreflangs, `${page.canonical} has the expected locale alternates`);
  const alternateLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .filter((tag) => getAttribute(tag, 'rel') === 'alternate');
  for (const locale of page.alternateLocales) {
    const expectedUrl = locale === 'en'
      ? page.canonical
      : `https://www.clickpdf.net/${locale}/tools/${page.slug}/`;
    assert.ok(alternateLinks.some((tag) =>
      getAttribute(tag, 'hreflang') === locale && getAttribute(tag, 'href') === expectedUrl,
    ));
  }
  assert.ok(alternateLinks.some((tag) =>
    getAttribute(tag, 'hreflang') === 'x-default' && getAttribute(tag, 'href') === page.canonical,
  ));

  const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  assert.ok(main, `${page.canonical} has crawlable route content`);
  assert.equal((main.match(/<h1\b/gi) || []).length, 1);
  assert.ok(main.includes(escapeHtml(page.content.intro)));
  assert.ok(main.includes(escapeHtml(page.content.secondaryOverview)));
  assert.ok(main.includes(escapeHtml(page.content.privacyHighlight)));
  for (const benefit of page.content.benefits) {
    assert.ok(main.includes(escapeHtml(benefit.title)));
    assert.ok(main.includes(escapeHtml(benefit.desc)));
  }
  for (const step of page.content.steps) {
    assert.ok(main.includes(escapeHtml(step.title)));
    assert.ok(main.includes(escapeHtml(step.description)));
  }
  for (const faq of page.content.faqs) {
    assert.ok(main.includes(escapeHtml(faq.question)));
    assert.ok(main.includes(escapeHtml(faq.answer)));
  }

  const schemaText = html.match(/<script type="application\/ld\+json" data-restored-tool-schema>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(schemaText, `${page.canonical} has raw initial structured data`);
  const schema = JSON.parse(schemaText);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.equal(schema['@graph'].length, 3);
  const webApplication = schema['@graph'].find((item) => item['@type'] === 'WebApplication');
  const howTo = schema['@graph'].find((item) => item['@type'] === 'HowTo');
  const faqPage = schema['@graph'].find((item) => item['@type'] === 'FAQPage');
  assert.equal(webApplication?.url, page.canonical);
  assert.equal(webApplication?.name, page.toolSeo.h1Title);
  assert.equal(webApplication?.featureList.length, page.toolSeo.benefits.length);
  assert.equal(howTo?.step.length, page.toolSeo.steps.length);
  assert.equal(faqPage?.mainEntity.length, page.toolSeo.faqs.length);
  console.log(`PASS ${englishStatusByCanonical.get(page.canonical)} ${new URL(page.canonical).pathname} | route title, H1, description, canonical, OG/Twitter, hreflang and 3 schemas match source`);
}
assert.equal(uniqueTitles.size, englishPages.length, 'all 23 English routes have distinct route titles');
assert.equal(englishHtmlByCanonical.size, 23);

const missingRoute = await fetch(new URL('/__task194_missing_route__', origin));
assert.equal(missingRoute.status, 200);
assert.equal(await missingRoute.text(), rootIndex);

console.log(`PASS: Wrangler served ${staticPages.length} static tool pages; all 23 English canonical routes returned route-specific HTML. Unknown-route SPA fallback remains unchanged; sitemap routes=${sitemapPages.length}.`);

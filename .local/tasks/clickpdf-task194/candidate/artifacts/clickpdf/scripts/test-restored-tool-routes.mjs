import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import {
  RESTORED_TOOL_IDS,
  SEO_TITLE_PAIRS,
  SITE_ORIGIN,
  readRestoredToolPages,
  readTypeScriptExport,
} from './restored-tool-page-data.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const outputDir = path.join(appDir, 'dist', 'public');
const { pages, sitemapPages, publicToolIds, localeCodes } = await readRestoredToolPages(appDir);
const sitemap = await readFile(path.join(outputDir, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi)].map((match) => match[1].trim());
const pageByKey = new Map(pages.map((page) => [`${page.toolId}:${page.locale}`, page]));
const candidateLocs = sitemapPages.map((page) => page.canonical);
const uniqueCandidateLocs = new Set(candidateLocs);
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');
const normalizedPath = (value) => new URL(value).pathname.replace(/\/+$/, '') || '/';

assert.equal(publicToolIds.length, 25, 'candidate exposes exactly the approved 25 public tools');
assert.equal(localeCodes.length, 21, 'all 21 selectable languages remain supported');
assert.equal(pages.length, 100, '100 distinct static HTML routes cover the approved scopes');
assert.equal(sitemapPages.length, 123, 'sitemap includes each static route and the 23 English alternates');
assert.equal(new Set(pages.map((page) => page.canonical)).size, pages.length, 'static page canonical URLs are unique');
assert.equal(uniqueCandidateLocs.size, sitemapPages.length, 'sitemap candidate canonical URLs are unique');
assert.equal(pages.filter((page) => RESTORED_TOOL_IDS.includes(page.toolId)).length, 42);
assert.equal(pages.filter((page) => page.locale === 'ja').length, 25);
assert.equal(pages.filter((page) => page.locale === 'zh').length, 25);
assert.equal(
  pages.filter((page) => page.locale !== 'en').length,
  98,
  'non-English route count includes the two complete 21-language tools plus scoped SEO and CJK routes',
);

const baseline = JSON.parse(await readFile(
  path.join(scriptDir, 'fixtures', 'task194-origin-sitemap-locs.json'),
  'utf8',
));
assert.equal(baseline.baseSourceSha, '3631f75badc8ba1fe0533d2f3489269adfbfa748');
assert.equal(baseline.locs.length, 32, 'fixture records every URL in the origin baseline sitemap');
const candidatePaths = new Set(candidateLocs.map(normalizedPath));
const preservedBaselineLocs = baseline.locs.filter((url) => !candidatePaths.has(normalizedPath(url)));
const expectedLocs = [...new Set([...preservedBaselineLocs, ...candidateLocs])].sort();
assert.equal(preservedBaselineLocs.length, 17, 'all baseline pages outside the current canonical tool paths remain intact');
assert.equal(expectedLocs.length, 140, 'sitemap includes the 123 canonical tool URLs and 17 preserved non-target URLs');
assert.equal(locs.length, new Set(locs).size, 'sitemap <loc> values remain unique');
assert.deepEqual([...locs].sort(), expectedLocs, 'only target route paths are replaced or added; baseline URLs otherwise remain exact');
assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
assert.match(sitemap, new RegExp(`Total sitemap URLs: ${expectedLocs.length}`));
assert.match(
  sitemap,
  /Total sitemap URLs: 140; canonical tool URL entries: 123; public tools: 25; static tool HTML pages: 123 \(100 scoped locale pages \+ 23 English routes\)\./,
);

const sitemapBlocks = new Map(
  [...sitemap.matchAll(/<url\b[\s\S]*?<\/url>/gi)].map((match) => {
    const loc = match[0].match(/<loc>\s*([\s\S]*?)\s*<\/loc>/i)?.[1]?.trim();
    return [loc, match[0]];
  }),
);

for (const page of pages) {
  const relativePath = page.locale === 'en'
    ? path.join('tools', page.slug, 'index.html')
    : path.join(page.locale, 'tools', page.slug, 'index.html');
  const html = await readFile(path.join(outputDir, relativePath), 'utf8');
  const langAndDir = new RegExp(`<html\\b[^>]*\\blang="${page.locale}"[^>]*\\bdir="${page.direction}"`, 'i');
  assert.match(html, langAndDir, `${page.locale}:${page.toolId} has correct html lang and direction`);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${page.locale}:${page.toolId} has exactly one H1`);
  assert.ok((html.match(/<h2\b/gi) || []).length >= 3, `${page.locale}:${page.toolId} has a useful heading hierarchy`);
  assert.ok(html.includes(`<title>${escapeHtml(page.seoTitle)} | ClickPDF</title>`), `${page.locale}:${page.toolId} has the intended SEO title`);
  assert.ok(html.includes(`content="${escapeHtml(page.description)}"`), `${page.locale}:${page.toolId} has a localized meta description`);
  assert.ok(html.includes('name="robots" content="index,follow"'), `${page.locale}:${page.toolId} is indexable`);
  assert.doesNotMatch(html, /name=["']robots["'][^>]*content=["'][^"']*noindex/i);
  assert.ok(html.includes(`property="og:url" content="${page.canonical}"`), `${page.locale}:${page.toolId} has canonical OG URL`);
  assert.ok(html.includes(`name="twitter:title" content="${escapeHtml(page.seoTitle)} | ClickPDF"`));
  assert.ok(html.includes(`<link rel="canonical" href="${page.canonical}" />`));

  const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
  assert.ok(main, `${page.locale}:${page.toolId} has crawlable main content`);
  assert.ok(main.includes(escapeHtml(page.content.introHeading || page.labels.quickAnswer)));
  assert.ok(main.includes(escapeHtml(page.content.intro)));
  assert.ok(main.includes(escapeHtml(page.content.stepsHeading || page.labels.howTo)));
  for (const step of page.content.steps) {
    assert.ok(main.includes(escapeHtml(step.title)), `${page.locale}:${page.toolId} includes a full step title`);
    assert.ok(main.includes(escapeHtml(step.description)), `${page.locale}:${page.toolId} includes a full step description`);
  }
  for (const faq of page.content.faqs) {
    assert.ok(main.includes(escapeHtml(faq.question)), `${page.locale}:${page.toolId} includes each FAQ question`);
    assert.ok(main.includes(escapeHtml(faq.answer)), `${page.locale}:${page.toolId} includes each FAQ answer`);
  }
  if (page.locale === 'ja' || page.locale === 'zh') {
    const visibleText = main.replace(/<[^>]+>/g, ' ');
    const cjkCount = (visibleText.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
    assert.ok(cjkCount >= 200, `${page.locale}:${page.toolId} has substantive raw CJK copy (${cjkCount} characters)`);
  }

  const schema = html.match(/<script type="application\/ld\+json" data-restored-tool-schema>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(schema, `${page.locale}:${page.toolId} has static FAQ and HowTo schema`);
  const schemaItems = JSON.parse(schema);
  assert.equal(schemaItems.find((item) => item['@type'] === 'FAQPage')?.mainEntity?.length, page.content.faqs.length);
  assert.equal(schemaItems.find((item) => item['@type'] === 'HowTo')?.step?.length, page.content.steps.length);

  const expectedHreflangs = [...page.alternateLocales, 'x-default'].sort();
  const htmlHreflangs = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)"/g)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(htmlHreflangs, expectedHreflangs, `${page.locale}:${page.toolId} exposes only complete hreflang alternates`);
}

for (const page of sitemapPages) {
  const sitemapBlock = sitemapBlocks.get(page.canonical);
  assert.ok(sitemapBlock, `${page.canonical} appears once in the sitemap`);
  for (const locale of page.alternateLocales) {
    const href = locale === 'en'
      ? `${SITE_ORIGIN}/tools/${page.slug}/`
      : `${SITE_ORIGIN}/${locale}/tools/${page.slug}/`;
    assert.ok(sitemapBlock.includes(`hreflang="${locale}" href="${href}"`));
  }
  assert.ok(sitemapBlock.includes(`hreflang="x-default" href="${SITE_ORIGIN}/tools/${page.slug}/"`));
}

for (const { toolId, locales } of SEO_TITLE_PAIRS) {
  const [localeA, localeB] = locales;
  const pageA = pageByKey.get(`${toolId}:${localeA}`);
  const pageB = pageByKey.get(`${toolId}:${localeB}`);
  assert.ok(pageA && pageB, `${toolId} has both localized pages for its approved title pair`);
  assert.equal(pageA.title, pageB.title, `${toolId} retains the existing visible short titles`);
  assert.notEqual(pageA.seoTitle, pageB.seoTitle, `${toolId} has distinct SEO titles`);
  for (const page of [pageA, pageB]) {
    const relativePath = page.locale === 'en'
      ? path.join('tools', page.slug, 'index.html')
      : path.join(page.locale, 'tools', page.slug, 'index.html');
    const html = await readFile(path.join(outputDir, relativePath), 'utf8');
    assert.ok(html.includes(`<title>${escapeHtml(page.seoTitle)} | ClickPDF</title>`));
  }
}

const approvedTitleFixture = JSON.parse(await readFile(
  path.join(scriptDir, 'fixtures', 'task194-approved-seo-title-pairs.json'),
  'utf8',
));
assert.equal(approvedTitleFixture.pairs.length, SEO_TITLE_PAIRS.length);
for (const pair of approvedTitleFixture.pairs) {
  for (const [locale, expectedSeoTitle] of Object.entries(pair.locales)) {
    const page = pageByKey.get(`${pair.toolId}:${locale}`);
    assert.ok(page, `${pair.toolId}:${locale} has a generated page`);
    assert.equal(page.seoTitle, expectedSeoTitle, `${pair.toolId}:${locale} matches the approved SEO title`);
  }
}

const qa = JSON.parse(await readFile(path.join(appDir, 'src/data/restoredToolSeoQa.json'), 'utf8'));
const nonEnglishPages = pages.filter((page) => page.locale !== 'en');
assert.equal(qa.baseSourceSha, baseline.baseSourceSha);
assert.equal(qa.entries.length, nonEnglishPages.length);
assert.equal(new Set(qa.entries.map((entry) => `${entry.locale}:${entry.tool}`)).size, qa.entries.length);
for (const entry of qa.entries) {
  assert.equal(entry.status, 'generated_draft');
  assert.equal(entry.humanReviewed, false);
  assert.equal(entry.reviewer, null);
}

const [seoRegistry, translations, missingTranslations, languages] = await Promise.all([
  readTypeScriptExport(path.join(appDir, 'src/data/toolSeoData.ts'), 'TOOL_SEO_REGISTRY'),
  readTypeScriptExport(path.join(appDir, 'src/i18n/translations.ts'), 'TOOL_TRANSLATIONS'),
  readTypeScriptExport(path.join(appDir, 'src/i18n/missingToolTranslations.ts'), 'MISSING_TOOL_TRANSLATIONS'),
  readTypeScriptExport(path.join(appDir, 'src/i18n/translations.ts'), 'SUPPORTED_LANGUAGES'),
]);
globalThis.__TASK194_SEO_REGISTRY__ = seoRegistry;
globalThis.__TASK194_TOOL_TRANSLATIONS__ = translations;
globalThis.__TASK194_MISSING_TRANSLATIONS__ = missingTranslations;
globalThis.__TASK194_LANGUAGES__ = languages;
const routeParserSource = (await readFile(path.join(appDir, 'src/utils/routeParser.ts'), 'utf8'))
  .replace(
    "import { PDF_TOOLS } from '../data/toolsData';",
    'const PDF_TOOLS = [];',
  )
  .replace(
    "import { getToolSeoInfo } from '../data/toolSeoData';",
    `const getToolSeoInfo = (slug) => Object.values(globalThis.__TASK194_SEO_REGISTRY__).find((tool) => tool.slug === slug || tool.aliases?.includes(slug));`,
  )
  .replace(
    "import { Language, SUPPORTED_LANGUAGES, TOOL_TRANSLATIONS } from '../i18n/translations';",
    'const SUPPORTED_LANGUAGES = globalThis.__TASK194_LANGUAGES__; const TOOL_TRANSLATIONS = globalThis.__TASK194_TOOL_TRANSLATIONS__;',
  )
  .replace(
    "import { MISSING_TOOL_TRANSLATIONS } from '../i18n/missingToolTranslations';",
    'const MISSING_TOOL_TRANSLATIONS = globalThis.__TASK194_MISSING_TRANSLATIONS__;',
  )
  .replace("const BASE_PATH = import.meta.env.BASE_URL;", "const BASE_PATH = '/';");
const compiledRouteParser = ts.transpileModule(routeParserSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { parseCurrentRoute } = await import(
  `data:text/javascript;base64,${Buffer.from(compiledRouteParser).toString('base64')}`
);
const originalWindow = globalThis.window;
globalThis.window = { location: { pathname: '/', hash: '', search: '' } };
try {
  for (const page of sitemapPages) {
    globalThis.window.location.pathname = new URL(page.canonical).pathname;
    const parsed = parseCurrentRoute();
    assert.equal(parsed.view, 'tool', `${page.locale}:${page.toolId} path resolves to a tool`);
    assert.equal(parsed.toolId, page.toolId, `${page.locale}:${page.toolId} path resolves to the correct tool`);
    assert.equal(parsed.locale || 'en', page.locale, `${page.locale}:${page.toolId} path retains its explicit locale`);
  }
} finally {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  delete globalThis.__TASK194_SEO_REGISTRY__;
  delete globalThis.__TASK194_TOOL_TRANSLATIONS__;
  delete globalThis.__TASK194_MISSING_TRANSLATIONS__;
  delete globalThis.__TASK194_LANGUAGES__;
}

console.log(`PASS: ${pages.length} static routes; 42 restored-tool, 50 CJK, 14 title-pair pages; ${sitemapPages.length} canonical tool sitemap entries; ${expectedLocs.length} unique total URLs; localized client routes and unreviewed QA state verified.`);

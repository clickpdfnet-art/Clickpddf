import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { readActiveToolRegistry } from './static-tool-registry.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(appDir, 'dist', 'public');
const siteOrigin = 'https://www.clickpdf.net';
const contentByLocale = JSON.parse(
  await readFile(path.join(appDir, 'src', 'i18n', 'toolSeoContentTranslations.json'), 'utf8'),
);
const qaLedger = JSON.parse(
  await readFile(path.join(appDir, 'src', 'i18n', 'toolSeoTranslationQa.json'), 'utf8'),
);
const translationsSource = await readFile(path.join(appDir, 'src', 'i18n', 'translations.ts'), 'utf8');
const routeParserSource = await readFile(path.join(appDir, 'src', 'utils', 'routeParser.ts'), 'utf8');
const tools = await readActiveToolRegistry(appDir);
const mergeTool = tools.find((tool) => tool.id === 'merge');
const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrlSet = new Set(sitemapUrls);
const supportedLanguageCodes = [
  ...translationsSource.matchAll(/^\s*\|\s*'([a-z]{2})'/gm),
].map((match) => match[1]);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function schemaNodes(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
  return [...head.matchAll(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      const schema = JSON.parse(match[1]);
      return Array.isArray(schema['@graph']) ? schema['@graph'] : [schema];
    });
}

test('every completed localized Merge PDF route has matching page, schema, sitemap, and alternates', async () => {
  assert.ok(mergeTool, 'the Merge PDF tool is active');
  assert.deepEqual(Object.keys(contentByLocale).sort(), ['de', 'ja', 'ur']);

  for (const [locale, localeData] of Object.entries(contentByLocale)) {
    const content = localeData.tools.merge;
    assert.equal(content.steps.length, 3, `${locale} has exactly three How-to steps`);
    assert.equal(content.faqs.length, 6, `${locale} has exactly six tool-specific FAQs`);
    assert.equal(new Set(content.faqs.map((faq) => faq.question)).size, 6, `${locale} FAQ questions are distinct`);
    assert.ok(content.steps.every((step) => step.title && step.description), `${locale} steps have titles and descriptions`);
    assert.ok(content.faqs.every((faq) => faq.question && faq.answer), `${locale} FAQs have questions and answers`);

    const localizedUrl = `${siteOrigin}/${locale}/tools/${mergeTool.slug}/`;
    const pagePath = path.join(publicDir, locale, 'tools', mergeTool.slug, 'index.html');
    const html = await readFile(pagePath, 'utf8');
    const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
    assert.ok(main, `${locale} route has crawlable static page content`);
    assert.match(html, new RegExp(`<html[^>]*lang=["']${locale}["']`, 'i'));
    assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']${localizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`));
    assert.match(html, new RegExp(`<title>${escapeHtml(`${mergeTool.localizedTitles[locale].title} | ClickPDF`)}</title>`));
    assert.match(html, new RegExp(`<meta name="description" content="${escapeHtml(mergeTool.localizedTitles[locale].description)}"`));
    assert.match(main, new RegExp(`<h2 id=["']seo-tool-steps["']>${escapeHtml(content.stepsHeading)}`));

    for (const step of content.steps) {
      assert.ok(main.includes(escapeHtml(step.title)), `${locale} visible How-to includes "${step.title}"`);
      assert.ok(main.includes(escapeHtml(step.description)), `${locale} visible How-to includes its description`);
    }
    for (const faq of content.faqs) {
      assert.ok(main.includes(`<summary>${escapeHtml(faq.question)}</summary>`), `${locale} visible FAQ includes "${faq.question}"`);
      assert.ok(main.includes(`<p>${escapeHtml(faq.answer)}</p>`), `${locale} visible FAQ answer matches source`);
    }

    const nodes = schemaNodes(html);
    const localizedWebPage = nodes.find((node) => node['@type'] === 'WebPage' && node.url === localizedUrl);
    const application = nodes.find((node) =>
      Array.isArray(node['@type']) && node['@type'].includes('WebApplication') && node.url === localizedUrl,
    );
    const howTo = nodes.find((node) => node['@type'] === 'HowTo');
    const faqPage = nodes.find((node) => node['@type'] === 'FAQPage');
    const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList');
    assert.equal(localizedWebPage?.inLanguage, locale);
    assert.equal(application?.inLanguage, locale);
    assert.equal(howTo?.inLanguage, locale);
    assert.equal(faqPage?.inLanguage, locale);
    assert.equal(howTo?.step.length, 3);
    assert.equal(faqPage?.mainEntity.length, 6);
    assert.deepEqual(
      faqPage.mainEntity.map((item) => item.name),
      content.faqs.map((faq) => faq.question),
    );
    assert.deepEqual(
      howTo.step.map((step) => step.name),
      content.steps.map((step) => step.title),
    );
    assert.equal(breadcrumb?.itemListElement?.[1]?.item, localizedUrl);
    assert.equal(breadcrumb?.itemListElement?.[1]?.name, mergeTool.localizedTitles[locale].title);

    const pageAlternates = [...html.matchAll(/<link rel=["']alternate["'] hreflang=["']([^"']+)["'] href=["']([^"']+)["']/g)];
    assert.equal(
      pageAlternates.length,
      Object.keys(contentByLocale).length + 2,
      `${locale} static page has one alternate per locale plus x-default`,
    );
    const alternateMap = new Map(pageAlternates.map((match) => [match[1], match[2]]));
    assert.equal(alternateMap.get('en'), `${siteOrigin}/tools/${mergeTool.slug}/`);
    for (const alternateLocale of Object.keys(contentByLocale)) {
      assert.equal(
        alternateMap.get(alternateLocale),
        `${siteOrigin}/${alternateLocale}/tools/${mergeTool.slug}/`,
        `${locale} page reciprocally lists ${alternateLocale}`,
      );
    }
    assert.equal(alternateMap.get('x-default'), `${siteOrigin}/tools/${mergeTool.slug}/`);

    assert.ok(sitemap.includes(`<loc>${localizedUrl}</loc>`), `${locale} URL is present in the sitemap`);
    assert.ok(
      sitemap.includes(`hreflang="${locale}" href="${localizedUrl}"`),
      `${locale} URL is represented as a sitemap alternate`,
    );
  }
});

test('localized tool route matrix keeps only complete, source-checked locale pairs discoverable', async () => {
  assert.equal(tools.length, 21, 'the active public tool registry contains 21 tools');
  assert.equal(supportedLanguageCodes.length, 21, 'the selector supports 21 languages');
  assert.equal(tools.length * supportedLanguageCodes.length, 441, 'the complete tool-language matrix has 441 possible pairs');

  const contentPairs = Object.entries(contentByLocale).flatMap(([locale, localeData]) =>
    Object.keys(localeData.tools).map((toolId) => `${locale}:${toolId}`),
  ).sort();
  assert.deepEqual(
    contentPairs,
    [
      'de:compress', 'de:jpg-to-pdf', 'de:merge',
      'ja:compress', 'ja:jpg-to-pdf', 'ja:merge',
      'ur:compress', 'ur:jpg-to-pdf', 'ur:merge',
    ],
    'only the six new draft pages and three pre-existing localized Merge pages are complete',
  );

  const qaByPair = new Map(qaLedger.entries.map((entry) => [`${entry.locale}:${entry.tool}`, entry]));
  assert.equal(qaByPair.size, contentPairs.length, 'the QA ledger has one record per localized tool page');
  for (const pair of contentPairs) {
    const entry = qaByPair.get(pair);
    assert.ok(entry, `${pair} has an explicit QA record`);
    assert.equal(entry.humanReviewed, false, `${pair} does not claim unverified human review`);
    assert.equal(entry.reviewer, null, `${pair} has no invented reviewer identity`);
    assert.ok(
      ['existing_unverified', 'generated_draft', 'human_reviewed'].includes(entry.status),
      `${pair} uses a documented QA status`,
    );
    if (pair.includes(':compress') || pair.includes(':jpg-to-pdf')) {
      assert.equal(entry.status, 'generated_draft', `${pair} remains identified as a draft`);
      assert.equal(entry.contentCheckedAgainstToolBehavior, true, `${pair} is checked against the tool behavior`);
    }
  }

  const localizedToolSitemapUrls = sitemapUrls.filter((url) =>
    /^https:\/\/www\.clickpdf\.net\/[a-z]{2}\/tools\/[^/]+\/$/.test(url),
  );
  assert.equal(localizedToolSitemapUrls.length, contentPairs.length);
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'all sitemap URLs remain unique');

  const localizedQuestionsByLocale = new Map();
  for (const [locale, localeData] of Object.entries(contentByLocale)) {
    for (const [toolId, content] of Object.entries(localeData.tools)) {
      const tool = tools.find((item) => item.id === toolId);
      assert.ok(tool, `${toolId} remains in the active tool registry`);
      assert.ok(content.introHeading && content.intro, `${locale}:${toolId} has a localized introduction`);
      assert.equal(content.steps.length, 3, `${locale}:${toolId} has three tool-specific steps`);
      assert.equal(content.faqs.length, 6, `${locale}:${toolId} has six tool-specific FAQs`);
      assert.equal(new Set(content.faqs.map((faq) => faq.question)).size, 6, `${locale}:${toolId} FAQ questions are distinct`);
      const contentText = JSON.stringify({
        title: tool.localizedTitles[locale]?.title,
        description: tool.localizedTitles[locale]?.description,
        content,
      });
      if (toolId === 'compress') {
        assert.doesNotMatch(
          contentText,
          /verlustfrei|画質を落とさず|without (?:any )?loss|بغیر نقصان(?: کے)? معیار/iu,
          `${locale} compression copy does not promise lossless results`,
        );
      }
      if (toolId === 'jpg-to-pdf') {
        assert.match(contentText, /JPG[\s\S]*PNG[\s\S]*WebP/i, `${locale} names all supported image formats`);
        const resolutionFaq = content.faqs.find((faq) => /resolution|auflösung|解像度|ریزولوشن/i.test(faq.question));
        assert.ok(resolutionFaq, `${locale} explains that conversion does not increase image resolution`);
        assert.match(resolutionFaq.answer, /^(?:Nein|いいえ|نہیں)/, `${locale} does not promise image upscaling`);
      }

      const allQuestions = localizedQuestionsByLocale.get(locale) || [];
      allQuestions.push(...content.faqs.map((faq) => faq.question));
      localizedQuestionsByLocale.set(locale, allQuestions);

      const localizedUrl = `${siteOrigin}/${locale}/tools/${tool.slug}/`;
      assert.ok(sitemapUrlSet.has(localizedUrl), `${localizedUrl} is in the sitemap`);
      const pagePath = path.join(publicDir, locale, 'tools', tool.slug, 'index.html');
      const html = await readFile(pagePath, 'utf8');
      const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
      assert.ok(main, `${localizedUrl} has crawlable static content`);
      assert.match(html, new RegExp(`<html[^>]*lang=["']${locale}["']`, 'i'));
      assert.match(html, new RegExp(`<html[^>]*dir=["']${locale === 'ur' ? 'rtl' : 'ltr'}["']`, 'i'));
      assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']${localizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`));
      assert.match(html, new RegExp(`<title>${escapeHtml(`${tool.localizedTitles[locale].title} | ClickPDF`)}</title>`));
      assert.match(html, new RegExp(`<meta name="description" content="${escapeHtml(tool.localizedTitles[locale].description)}"`));
      assert.match(html, /property=["']og:title["']/i, 'localized page has Open Graph title metadata');
      assert.match(html, /name=["']twitter:title["']/i, 'localized page has Twitter title metadata');
      assert.equal((main.match(/<h1\b/gi) || []).length, 1, `${localizedUrl} has exactly one visible H1`);
      assert.ok(main.includes(escapeHtml(content.introHeading)));
      assert.ok(main.includes(escapeHtml(content.intro)));
      assert.ok(main.includes(escapeHtml(content.stepsHeading)));

      for (const step of content.steps) {
        assert.ok(main.includes(escapeHtml(step.title)), `${locale}:${toolId} visible steps include "${step.title}"`);
        assert.ok(main.includes(escapeHtml(step.description)), `${locale}:${toolId} visible steps include their descriptions`);
      }
      for (const faq of content.faqs) {
        assert.ok(main.includes(`<summary>${escapeHtml(faq.question)}</summary>`), `${locale}:${toolId} visible FAQ includes its question`);
        assert.ok(main.includes(`<p>${escapeHtml(faq.answer)}</p>`), `${locale}:${toolId} visible FAQ includes its answer`);
      }

      const nodes = schemaNodes(html);
      const webPage = nodes.find((node) => node['@type'] === 'WebPage' && node.url === localizedUrl);
      const app = nodes.find((node) =>
        Array.isArray(node['@type']) && node['@type'].includes('WebApplication') && node.url === localizedUrl,
      );
      const howTo = nodes.find((node) => node['@type'] === 'HowTo');
      const faqPage = nodes.find((node) => node['@type'] === 'FAQPage');
      const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList');
      assert.equal(webPage?.inLanguage, locale);
      assert.equal(app?.inLanguage, locale);
      assert.equal(howTo?.inLanguage, locale);
      assert.equal(faqPage?.inLanguage, locale);
      assert.equal(howTo?.step.length, 3);
      assert.equal(faqPage?.mainEntity.length, 6);
      assert.equal(breadcrumb?.itemListElement?.[1]?.item, localizedUrl);
      assert.equal(breadcrumb?.itemListElement?.[1]?.name, tool.localizedTitles[locale].title);

      const expectedLocales = Object.keys(localeData.tools).length
        ? Object.keys(contentByLocale).filter((candidateLocale) =>
            Boolean(contentByLocale[candidateLocale].tools[toolId]),
          )
        : [];
      const alternates = new Map(
        [...html.matchAll(/<link rel=["']alternate["'] hreflang=["']([^"']+)["'] href=["']([^"']+)["']/g)]
          .map((match) => [match[1], match[2]]),
      );
      assert.equal(alternates.get('en'), `${siteOrigin}/tools/${tool.slug}/`);
      for (const alternateLocale of expectedLocales) {
        assert.equal(
          alternates.get(alternateLocale),
          `${siteOrigin}/${alternateLocale}/tools/${tool.slug}/`,
          `${localizedUrl} reciprocally lists ${alternateLocale}`,
        );
      }
      assert.equal(alternates.get('x-default'), `${siteOrigin}/tools/${tool.slug}/`);
      assert.equal(alternates.size, expectedLocales.length + 2);
      assert.ok(sitemap.includes(`hreflang="${locale}" href="${localizedUrl}"`));

      for (const match of main.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)) {
        const href = match[1];
        if (!href.startsWith('/')) continue;
        const target = new URL(href, siteOrigin);
        if (target.pathname !== '/' && !target.pathname.endsWith('/')) target.pathname += '/';
        assert.ok(
          sitemapUrlSet.has(target.toString()),
          `${localizedUrl} links to a discovered internal route: ${target.pathname}`,
        );
      }
    }
  }

  for (const [locale, questions] of localizedQuestionsByLocale) {
    assert.equal(new Set(questions).size, questions.length, `${locale} does not reuse FAQ questions across tools`);
  }

  const routePaths = sitemapUrls
    .map((url) => new URL(url).pathname)
    .filter((pathname) => /^\/(?:[a-z]{2}\/)?tools\/[^/]+\/$/.test(pathname));
  const englishToolRoutes = routePaths.filter((pathname) => pathname.startsWith('/tools/'));
  const localizedToolRoutes = routePaths.filter((pathname) => !pathname.startsWith('/tools/'));
  assert.equal(englishToolRoutes.length, 21);
  assert.equal(localizedToolRoutes.length, 9);
  assert.equal(routePaths.length, 30, '30 of 441 possible tool-language routes are complete and discoverable');
  assert.equal(tools.length * supportedLanguageCodes.length - routePaths.length, 411, '411 matrix pairs remain untranslated');

  assert.match(
    routeParserSource,
    /hasLocalizedToolPageSeoContent\(toolId,\s*language\)/,
    'manual language switching routes to a tool page only when that localized content exists',
  );
});

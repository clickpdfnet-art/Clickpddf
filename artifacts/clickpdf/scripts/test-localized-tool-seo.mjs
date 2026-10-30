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
const tools = await readActiveToolRegistry(appDir);
const mergeTool = tools.find((tool) => tool.id === 'merge');
const sitemap = await readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');

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

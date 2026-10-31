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
  const mergeLocales = Object.entries(contentByLocale)
    .filter(([, localeData]) => localeData.tools.merge)
    .map(([locale]) => locale)
    .sort();
  assert.deepEqual(mergeLocales, ['ar', 'de', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ru', 'sv', 'tl', 'tr', 'ur', 'vi', 'zh']);

  for (const locale of mergeLocales) {
    const content = contentByLocale[locale].tools.merge;
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
      mergeLocales.length + 2,
      `${locale} static page has one alternate per locale plus x-default`,
    );
    const alternateMap = new Map(pageAlternates.map((match) => [match[1], match[2]]));
    assert.equal(alternateMap.get('en'), `${siteOrigin}/tools/${mergeTool.slug}/`);
    for (const alternateLocale of mergeLocales) {
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
      'ar:compress', 'ar:edit-metadata', 'ar:excel-to-pdf', 'ar:jpg-to-pdf', 'ar:merge', 'ar:metadata', 'ar:organize', 'ar:page-numbers', 'ar:pdf-to-excel', 'ar:pdf-to-image', 'ar:pdf-to-powerpoint', 'ar:pdf-to-text', 'ar:pdf-to-word', 'ar:protect', 'ar:rotate', 'ar:sign', 'ar:split', 'ar:unlock', 'ar:watermark', 'ar:word-to-excel', 'ar:word-to-pdf',
      'de:compress', 'de:edit-metadata', 'de:excel-to-pdf', 'de:jpg-to-pdf', 'de:merge', 'de:metadata', 'de:organize', 'de:page-numbers', 'de:pdf-to-excel', 'de:pdf-to-image', 'de:pdf-to-powerpoint', 'de:pdf-to-text', 'de:pdf-to-word', 'de:protect', 'de:rotate', 'de:sign', 'de:split', 'de:unlock', 'de:watermark', 'de:word-to-excel', 'de:word-to-pdf',
      'es:compress', 'es:jpg-to-pdf', 'es:merge', 'es:metadata', 'es:pdf-to-excel', 'es:pdf-to-image', 'es:pdf-to-text', 'es:pdf-to-word', 'es:rotate', 'es:split', 'es:watermark', 'es:word-to-excel',
      'fr:compress', 'fr:edit-metadata', 'fr:excel-to-pdf', 'fr:jpg-to-pdf', 'fr:merge', 'fr:metadata', 'fr:organize', 'fr:page-numbers', 'fr:pdf-to-excel', 'fr:pdf-to-image', 'fr:pdf-to-powerpoint', 'fr:pdf-to-text', 'fr:pdf-to-word', 'fr:protect', 'fr:rotate', 'fr:sign', 'fr:split', 'fr:unlock', 'fr:watermark', 'fr:word-to-excel', 'fr:word-to-pdf',
      'hi:compress', 'hi:edit-metadata', 'hi:excel-to-pdf', 'hi:jpg-to-pdf', 'hi:merge', 'hi:metadata', 'hi:organize', 'hi:page-numbers', 'hi:pdf-to-excel', 'hi:pdf-to-image', 'hi:pdf-to-powerpoint', 'hi:pdf-to-text', 'hi:pdf-to-word', 'hi:protect', 'hi:rotate', 'hi:sign', 'hi:split', 'hi:unlock', 'hi:watermark', 'hi:word-to-excel', 'hi:word-to-pdf',
      'id:compress', 'id:edit-metadata', 'id:excel-to-pdf', 'id:jpg-to-pdf', 'id:merge', 'id:metadata', 'id:organize', 'id:page-numbers', 'id:pdf-to-excel', 'id:pdf-to-image', 'id:pdf-to-powerpoint', 'id:pdf-to-text', 'id:pdf-to-word', 'id:protect', 'id:rotate', 'id:sign', 'id:split', 'id:unlock', 'id:watermark', 'id:word-to-excel', 'id:word-to-pdf',
      'it:compress', 'it:edit-metadata', 'it:excel-to-pdf', 'it:jpg-to-pdf', 'it:merge', 'it:metadata', 'it:organize', 'it:page-numbers', 'it:pdf-to-excel', 'it:pdf-to-image', 'it:pdf-to-powerpoint', 'it:pdf-to-text', 'it:pdf-to-word', 'it:protect', 'it:rotate', 'it:sign', 'it:split', 'it:unlock', 'it:watermark', 'it:word-to-excel', 'it:word-to-pdf',
      'ja:compress', 'ja:edit-metadata', 'ja:excel-to-pdf', 'ja:jpg-to-pdf', 'ja:merge', 'ja:metadata', 'ja:organize', 'ja:page-numbers', 'ja:pdf-to-excel', 'ja:pdf-to-image', 'ja:pdf-to-powerpoint', 'ja:pdf-to-text', 'ja:pdf-to-word', 'ja:protect', 'ja:rotate', 'ja:sign', 'ja:split', 'ja:unlock', 'ja:watermark', 'ja:word-to-excel', 'ja:word-to-pdf',
      'ko:compress', 'ko:edit-metadata', 'ko:excel-to-pdf', 'ko:jpg-to-pdf', 'ko:merge', 'ko:metadata', 'ko:organize', 'ko:page-numbers', 'ko:pdf-to-excel', 'ko:pdf-to-image', 'ko:pdf-to-powerpoint', 'ko:pdf-to-text', 'ko:pdf-to-word', 'ko:protect', 'ko:rotate', 'ko:sign', 'ko:split', 'ko:unlock', 'ko:watermark', 'ko:word-to-excel', 'ko:word-to-pdf',
      'nl:compress', 'nl:edit-metadata', 'nl:jpg-to-pdf', 'nl:merge', 'nl:metadata', 'nl:organize', 'nl:page-numbers', 'nl:pdf-to-excel', 'nl:pdf-to-image', 'nl:pdf-to-text', 'nl:pdf-to-word', 'nl:protect', 'nl:rotate', 'nl:split', 'nl:unlock', 'nl:watermark',
      'no:compress', 'no:edit-metadata', 'no:excel-to-pdf', 'no:jpg-to-pdf', 'no:merge', 'no:metadata', 'no:organize', 'no:page-numbers', 'no:pdf-to-excel', 'no:pdf-to-image', 'no:pdf-to-powerpoint', 'no:pdf-to-text', 'no:pdf-to-word', 'no:protect', 'no:rotate', 'no:sign', 'no:split', 'no:unlock', 'no:watermark', 'no:word-to-excel', 'no:word-to-pdf',
      'pl:compress', 'pl:edit-metadata', 'pl:jpg-to-pdf', 'pl:merge', 'pl:metadata', 'pl:organize', 'pl:page-numbers', 'pl:pdf-to-excel', 'pl:pdf-to-image', 'pl:pdf-to-text', 'pl:pdf-to-word', 'pl:protect', 'pl:rotate', 'pl:split', 'pl:unlock', 'pl:watermark',
      'pt:compress', 'pt:edit-metadata', 'pt:excel-to-pdf', 'pt:jpg-to-pdf', 'pt:merge', 'pt:metadata', 'pt:organize', 'pt:page-numbers', 'pt:pdf-to-excel', 'pt:pdf-to-image', 'pt:pdf-to-powerpoint', 'pt:pdf-to-text', 'pt:pdf-to-word', 'pt:protect', 'pt:rotate', 'pt:sign', 'pt:split', 'pt:unlock', 'pt:watermark', 'pt:word-to-excel', 'pt:word-to-pdf',
      'ru:compress', 'ru:edit-metadata', 'ru:excel-to-pdf', 'ru:jpg-to-pdf', 'ru:merge', 'ru:metadata', 'ru:organize', 'ru:page-numbers', 'ru:pdf-to-excel', 'ru:pdf-to-image', 'ru:pdf-to-powerpoint', 'ru:pdf-to-text', 'ru:pdf-to-word', 'ru:protect', 'ru:rotate', 'ru:sign', 'ru:split', 'ru:unlock', 'ru:watermark', 'ru:word-to-excel', 'ru:word-to-pdf',
      'sv:compress', 'sv:edit-metadata', 'sv:jpg-to-pdf', 'sv:merge', 'sv:metadata', 'sv:organize', 'sv:page-numbers', 'sv:pdf-to-excel', 'sv:pdf-to-image', 'sv:pdf-to-text', 'sv:pdf-to-word', 'sv:protect', 'sv:rotate', 'sv:split', 'sv:unlock', 'sv:watermark',
      'tl:compress', 'tl:jpg-to-pdf', 'tl:merge', 'tl:metadata', 'tl:pdf-to-excel', 'tl:pdf-to-image', 'tl:pdf-to-text', 'tl:pdf-to-word', 'tl:rotate', 'tl:split', 'tl:watermark', 'tl:word-to-excel',
      'tr:compress', 'tr:edit-metadata', 'tr:excel-to-pdf', 'tr:jpg-to-pdf', 'tr:merge', 'tr:metadata', 'tr:organize', 'tr:page-numbers', 'tr:pdf-to-excel', 'tr:pdf-to-image', 'tr:pdf-to-powerpoint', 'tr:pdf-to-text', 'tr:pdf-to-word', 'tr:protect', 'tr:rotate', 'tr:sign', 'tr:split', 'tr:unlock', 'tr:watermark', 'tr:word-to-excel', 'tr:word-to-pdf',
      'ur:compress', 'ur:edit-metadata', 'ur:excel-to-pdf', 'ur:jpg-to-pdf', 'ur:merge', 'ur:metadata', 'ur:organize', 'ur:page-numbers', 'ur:pdf-to-excel', 'ur:pdf-to-image', 'ur:pdf-to-powerpoint', 'ur:pdf-to-text', 'ur:pdf-to-word', 'ur:protect', 'ur:rotate', 'ur:sign', 'ur:split', 'ur:unlock', 'ur:watermark', 'ur:word-to-excel', 'ur:word-to-pdf',
      'vi:compress', 'vi:edit-metadata', 'vi:excel-to-pdf', 'vi:jpg-to-pdf', 'vi:merge', 'vi:metadata', 'vi:organize', 'vi:page-numbers', 'vi:pdf-to-excel', 'vi:pdf-to-image', 'vi:pdf-to-powerpoint', 'vi:pdf-to-text', 'vi:pdf-to-word', 'vi:protect', 'vi:rotate', 'vi:sign', 'vi:split', 'vi:unlock', 'vi:watermark', 'vi:word-to-excel', 'vi:word-to-pdf',
      'zh:compress', 'zh:jpg-to-pdf', 'zh:merge', 'zh:metadata', 'zh:pdf-to-excel', 'zh:pdf-to-image', 'zh:pdf-to-text', 'zh:pdf-to-word', 'zh:rotate', 'zh:split', 'zh:watermark', 'zh:word-to-excel',
    ],
    'only the 375 generated drafts and three pre-existing localized Merge pages are complete',
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
    if (['de:merge', 'ja:merge', 'ur:merge'].includes(pair)) {
      assert.equal(entry.status, 'existing_unverified', `${pair} preserves the pre-existing unverified Merge status`);
    } else {
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
          /verlustfrei|画質を落とさず|without (?:any )?loss|بغیر نقصان(?: کے)? معیار|गुणवत्ता खोए बिना|دون فقدان الجودة|sans perte|senza (?:perdita|perdite)(?: di qualità)?|uten tap av kvalitet|sem perda de qualidade/iu,
          `${locale} compression copy does not promise lossless results`,
        );
      }
      if (toolId === 'jpg-to-pdf') {
        assert.match(contentText, /JPG[\s\S]*PNG[\s\S]*WebP/i, `${locale} names all supported image formats`);
        const resolutionFaq = content.faqs.find((faq) => /resolution|auflösung|解像度|分辨率|разрешение|해상도|çözünürlük|çözünürlüğ|resolutie|rozdzielczość|upplösning|ریزولوشن|دقة|résolution|resolución|risoluzione|oppløsning|resolução|resolusi|độ phân giải/i.test(faq.question));
        assert.ok(resolutionFaq, `${locale} explains that conversion does not increase image resolution`);
        assert.match(resolutionFaq.answer, /^(?:Nein|いいえ|不会|Hindi|아니요|Hayır|Нет|Nee|Nie|Nej|نہیں|\u0928\u0939\u0940\u0902|لا|Non|No|Nei|Não|Tidak|Không)/u, `${locale} does not promise image upscaling`);
      }
      if (toolId === 'protect') {
        assert.match(contentText, /AES-256-GCM/i, `${locale} identifies the documented encryption format`);
        assert.match(contentText, /ClickPDF Unlock/, `${locale} explains which tool opens the protected format`);
        assert.doesNotMatch(contentText, /military|militär|軍事用|軍工/iu, `${locale} avoids unsupported military-grade wording`);
      }
      if (toolId === 'unlock') {
        assert.match(contentText, /ClickPDF Protect/, `${locale} limits the feature to ClickPDF Protect files`);
        const scopeLimit = {
          de: 'Beliebige passwortgeschützte Standard-PDFs',
          ja: '一般的なPDFのパスワード解除',
          ur: 'عام password-protected PDFs',
          hi: 'दूसरे सामान्य PDF',
          ar: 'ملفات PDF القياسية الأخرى',
          fr: 'PDF standard quelconque',
          it: 'PDF standard',
          no: 'vanlige PDF-filer',
          pt: 'PDFs padrão',
          nl: "standaard-PDF's",
          pl: 'standardowych plików PDF',
          sv: 'standard-PDF-filer',
          id: 'PDF standar',
          vi: 'PDF tiêu chuẩn',
          ru: 'стандартные PDF',
          ko: '표준 PDF',
          tr: 'standart PDF',
        }[locale];
        assert.ok(contentText.includes(scopeLimit), `${locale} states that arbitrary standard PDFs are not supported`);
      }
      if (toolId === 'pdf-to-text') {
        assert.match(contentText, /TXT[\s\S]*Markdown/i, `${locale} documents both text export formats`);
        assert.match(contentText, /OCR/i, `${locale} explains that image-only scans need OCR`);
      }
      if (toolId === 'pdf-to-word') {
        const conversionMarkers = {
          de: ['bearbeitbaren Text', 'Bild-Fallback'],
          ja: ['編集可能なテキスト', '画像フォールバック'],
          ur: ['قابلِ تدوین متن', 'image fallback'],
          hi: ['संपादन योग्य पाठ', 'छवि fallback'],
          ar: ['نص قابل للتحرير', 'الخيار الاحتياطي للصور'],
          fr: ['texte modifiable', 'solution de repli en images'],
          id: ['teks yang dapat diedit', 'fallback gambar'],
          vi: ['văn bản có thể chỉnh sửa', 'dự phòng bằng hình ảnh'],
          it: ['testo modificabile', 'fallback immagine'],
          no: ['redigerbar tekst', 'bildefallback'],
          pt: ['texto editável', 'fallback de imagem'],
          ru: ['редактируемый текст', 'резервный вариант изображения'],
          ko: ['편집 가능한 텍스트', '이미지 대체 방식'],
          tr: ['düzenlenebilir metin', 'görüntü yedeği'],
          zh: ['可编辑文本', '图像回退'],
          tl: ['editable na teksto', 'fallback na larawan'],
          es: ['texto editable', 'alternativa de imagen'],
          nl: ['bewerkbare tekst', 'fallback met afbeeldingen'],
          pl: ['edytowalny tekst', 'obrazowy tryb awaryjny'],
          sv: ['redigerbar text', 'bildbaserat reservläge'],
        }[locale];
        for (const marker of conversionMarkers) {
          assert.ok(contentText.includes(marker), `${locale} distinguishes editable text from the optional image fallback`);
        }
        assert.match(contentText, /OCR/i, `${locale} explains OCR needs for scanned pages`);
      }
      if (toolId === 'pdf-to-excel') {
        assert.match(contentText, /XLSX/i, `${locale} identifies the workbook output format`);
        assert.match(contentText, /OCR/i, `${locale} explains OCR needs for scanned tables`);
        const formulaQuestion = content.faqs.find((faq) => /सूत्र|صيغ|formul(?:e|es)|Formeln|数式|公式|فارمولے|rumus|công thức|forml|formül|fórmulas|формул|수식|pormula|formuł|formler/iu.test(faq.question));
        assert.ok(formulaQuestion, `${locale} addresses whether PDF formulas are recreated`);
        assert.match(formulaQuestion.answer, /^(?:नहीं|لا|Non|Nein|Nee|いいえ|不会|نہیں|Hindi|Tidak|Không|No|Nei|Nie|Não|Нет|아니요|Hayır)/u, `${locale} does not claim original spreadsheet formulas are restored`);
      }
      if (toolId === 'pdf-to-powerpoint') {
        assert.match(contentText, /PPTX/i, `${locale} identifies the presentation output format`);
        const originalStructureQuestion = content.faqs.find((faq) => /मूल PowerPoint objects|عناصر PowerPoint الأصلية|objets PowerPoint d’origine|ursprünglichen PowerPoint-Objekte|元のPowerPointオブジェクト|اصل PowerPoint objects|struktur PowerPoint asli|cấu trúc bản trình chiếu gốc|struttura PowerPoint originale|opprinnelige PowerPoint-strukturen|estrutura original da apresentação PowerPoint|исходная структура PowerPoint|원래 PowerPoint 구조|Özgün PowerPoint yapısı/iu.test(faq.question));
        assert.ok(originalStructureQuestion, `${locale} explains that a PDF does not preserve the original presentation structure`);
        assert.match(originalStructureQuestion.answer, /^(?:आमतौर पर नहीं|غالبًا لا|Généralement non|Meistens nicht|通常は含まれません|عام طور پر نہیں|Tidak|Không|No|Nei|Não|Нет|아니요|Hayır)/u, `${locale} avoids promising original slide objects`);
      }
      if (toolId === 'pdf-to-image') {
        assert.match(contentText, /PNG/i, `${locale} identifies the actual PNG image output`);
        const formatQuestion = content.faqs.find((faq) => /PNG.*JPG|JPG.*PNG/i.test(faq.question));
        assert.ok(formatQuestion, `${locale} distinguishes the supported image format`);
        assert.match(formatQuestion.answer, /PNG/i, `${locale} identifies PNG as the export format`);
      }
      if (toolId === 'word-to-pdf') {
        assert.match(contentText, /DOCX/i, `${locale} identifies the supported input format`);
        const legacyDocQuestion = content.faqs.find((faq) => /DOC/i.test(faq.question));
        assert.ok(legacyDocQuestion, `${locale} states that legacy DOC files are not supported`);
        const selectableQuestionMarkers = {
          hi: 'क्या बदली हुई PDF में text चुना जा सकता है?',
          ar: 'هل يمكن تحديد النص في PDF المحوّل؟',
          fr: 'Le texte du PDF converti est-il sélectionnable ?',
          ja: '変換したPDF内のテキストを選択できますか？',
          ur: 'کیا تبدیل شدہ PDF میں متن منتخب کیا جا سکتا ہے؟',
          de: 'Ist der Text im umgewandelten PDF auswählbar?',
          id: 'Apakah teks pada PDF hasil dapat dipilih?',
          vi: 'Có thể chọn văn bản trong PDF đầu ra không?',
          it: 'Il testo nel PDF convertito è selezionabile?',
          no: 'Kan jeg markere tekst i den konverterte PDF-en?',
          pt: 'O texto no PDF convertido pode ser selecionado?',
          ru: 'Можно ли выделить текст в преобразованном PDF?',
          ko: '변환된 PDF에서 텍스트를 선택할 수 있나요?',
          tr: "Dönüştürülen PDF'deki metin seçilebilir mi?",
        };
        const selectableQuestion = content.faqs.find((faq) => faq.question === selectableQuestionMarkers[locale]);
        assert.ok(selectableQuestion, `${locale} explains the image-based PDF text limitation`);
        const imageAnswerMarkers = { hi: 'छवियों', ar: 'صور', fr: 'images', ja: '画像', ur: 'تصاویر', de: 'Bilder', id: 'gambar', vi: 'hình ảnh', it: 'immagini', no: 'bilder', pt: 'imagens', ru: 'изображениями', ko: '이미지', tr: 'görüntü' };
        assert.ok(selectableQuestion.answer.includes(imageAnswerMarkers[locale]), `${locale} says output pages are images`);
      }
      if (toolId === 'word-to-excel' && ['ru', 'ko', 'tr'].includes(locale)) {
        assert.match(contentText, /DOCX[\s\S]*XLSX/i, `${locale} identifies the DOCX input and XLSX output`);
        const extractionMarkers = {
          ru: ['отдельный лист', 'лист «Текст»'],
          ko: ['별도 XLSX 시트', '텍스트 시트'],
          tr: ['ayrı bir XLSX sayfasına', 'Metin sayfasında'],
        }[locale];
        for (const marker of extractionMarkers) {
          assert.ok(contentText.includes(marker), `${locale} explains table and text worksheet organization`);
        }
      }
      if (toolId === 'excel-to-pdf') {
        assert.match(contentText, /XLSX[\s\S]*XLS[\s\S]*CSV/i, `${locale} identifies the supported spreadsheet formats`);
      }
      if (toolId === 'sign' && ['ru', 'ko', 'tr'].includes(locale)) {
        assert.match(contentText, /PNG/i, `${locale} identifies PNG signature-image support`);
        const signatureQuestionMarkers = {
          ru: 'Создает ли инструмент подтвержденную цифровую подпись?',
          ko: '인증서 기반 디지털 서명을 생성하나요?',
          tr: 'Sertifikaya dayalı doğrulanmış dijital imza oluşturur mu?',
        };
        const signatureLimit = content.faqs.find((faq) => faq.question === signatureQuestionMarkers[locale]);
        assert.ok(signatureLimit, `${locale} distinguishes a visual mark from certificate-backed signing`);
        assert.match(signatureLimit.answer, /^(?:Нет|아니요|Hayır)/u, `${locale} does not claim identity verification`);
      }
      if (toolId === 'split' && ['hi', 'ar', 'fr'].includes(locale)) {
        const scannedFaqMarkers = {
          hi: 'क्या scanned PDF बाँटने से searchable text जुड़ता है?',
          ar: 'هل يضيف تقسيم PDF ممسوح ضوئيًا نصًا قابلًا للبحث؟',
          fr: 'La division d’un PDF scanné ajoute-t-elle du texte recherchable ?',
        };
        const scannedFaq = content.faqs.find((faq) => faq.question === scannedFaqMarkers[locale]);
        assert.ok(scannedFaq, `${locale} explains scanned-PDF OCR limitations`);
        assert.match(scannedFaq.answer, /^(?:नहीं|لا|Non)/u);
        assert.match(scannedFaq.answer, /OCR/i);
      }
      if (toolId === 'rotate' && ['hi', 'ar', 'fr'].includes(locale)) {
        const orientationFaqMarkers = {
          hi: 'क्या rotation से पृष्ठ की सामग्री बदलती है?',
          ar: 'هل يغيّر التدوير محتوى الصفحة؟',
          fr: 'La rotation modifie-t-elle le contenu d’une page ?',
        };
        const orientationFaq = content.faqs.find((faq) => faq.question === orientationFaqMarkers[locale]);
        assert.ok(orientationFaq, `${locale} distinguishes page orientation from page content`);
        assert.match(orientationFaq.answer, /(?:text|image content|نصها|محتواها|texte|contenu des images)/iu);
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
      assert.match(html, new RegExp(`<html[^>]*dir=["']${['ur', 'ar'].includes(locale) ? 'rtl' : 'ltr'}["']`, 'i'));
      assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']${localizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`));
      assert.match(html, new RegExp(`<title>${escapeHtml(`${tool.localizedTitles[locale].title} | ClickPDF`)}</title>`));
      assert.ok(
        html.includes(`<meta name="description" content="${escapeHtml(tool.localizedTitles[locale].description)}"`),
        `${localizedUrl} has its localized meta description`,
      );
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
  assert.equal(localizedToolRoutes.length, 378);
  assert.equal(routePaths.length, 399, '399 of 441 possible tool-language routes are complete and discoverable');
  assert.equal(tools.length * supportedLanguageCodes.length - routePaths.length, 42, '42 matrix pairs remain untranslated');

  assert.match(
    routeParserSource,
    /hasLocalizedToolPageSeoContent\(toolId,\s*language\)/,
    'manual language switching routes to a tool page only when that localized content exists',
  );
});

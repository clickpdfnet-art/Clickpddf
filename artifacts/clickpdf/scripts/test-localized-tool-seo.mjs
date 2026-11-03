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

const repairAccuracyMarkers = {
  ja: ['復旧は保証されず', '欠落・切断した内容は復元できません'],
  ur: ['بحالی کی ضمانت نہیں', 'غائب یا truncated مواد واپس نہیں آ سکتا'],
  de: ['nicht garantiert', 'fehlende oder abgeschnittene Inhalte lassen sich nicht zurückholen'],
  hi: ['गारंटी नहीं', 'गायब या कटा हुआ कंटेंट वापस नहीं बनाया जा सकता'],
  ar: ['لا يوجد ضمان', 'المفقود أو المبتور'],
  fr: ['n’est pas garantie', 'contenu manquant ou tronqué ne peut pas être restauré'],
  zh: ['不保证修复成功', '无法恢复缺失或被截断的内容'],
  tl: ['walang garantiya', 'hindi maibabalik ang nawawala o naputol na nilalaman'],
  es: ['no se garantiza la recuperación', 'no se restaura el contenido ausente o truncado'],
  it: ['non è garantito', 'contenuti mancanti o troncati non possono essere ripristinati'],
  no: ['ikke garantert', 'manglende eller avkortet innhold kan ikke gjenskapes'],
  pt: ['não é garantida', 'conteúdo ausente ou truncado não pode ser restaurado'],
  ru: ['не гарантируется', 'отсутствующее или усечённое содержимое вернуть нельзя'],
  ko: ['복구를 보장하지 않으며', '없거나 잘린 내용은 복원할 수 없습니다'],
  tr: ['kurtarma garanti edilmez', 'eksik ya da kesilmiş içerik geri getirilemez'],
  nl: ['niet gegarandeerd', 'ontbrekende of afgekorte inhoud kan niet worden teruggezet'],
  pl: ['nie jest gwarantowane', 'brakującej lub uciętej treści nie da się przywrócić'],
  sv: ['garanteras inte', 'saknat eller avklippt innehåll kan inte återskapas'],
  id: ['tidak dijamin', 'konten yang hilang atau terpotong tidak dapat dipulihkan'],
  vi: ['không đảm bảo khôi phục', 'nội dung bị thiếu hoặc bị cắt'],
};

const powerpointCharacterLimitMarkers = {
  ja: '表示できる文字には限りがあります',
  ur: 'محدود حروف کو سپورٹ کرتی ہے',
  de: 'begrenzten Zeichensatz',
  hi: 'सीमित वर्णों का समर्थन करता है',
  ar: 'مجموعة محدودة من الأحرف',
  fr: 'jeu de caractères limité',
  zh: '支持的字符有限',
  tl: 'Limitado ang mga character',
  es: 'conjunto limitado de caracteres',
  it: 'insieme limitato di caratteri',
  no: 'begrenset tegnsett',
  pt: 'conjunto limitado de caracteres',
  ru: 'ограниченный набор символов',
  ko: '제한된 문자 집합',
  tr: 'sınırlı sayıda karakteri',
  nl: 'beperkte tekenset',
  pl: 'ograniczony zestaw znaków',
  sv: 'begränsad teckenuppsättning',
  id: 'kumpulan karakter terbatas',
  vi: 'tập ký tự giới hạn',
};

test('tool SEO translations keep Repair copy separate from Compare content', () => {
  const repair = contentByLocale.ja.tools.repair;
  const compare = contentByLocale.ja.tools.compare;
  assert.match(repair.intro, /同じページ数で再度開ける/u);
  assert.match(compare.intro, /2つのPDFから選択可能なテキストをページごとに比較/u);
  assert.match(compare.faqs[2].answer, /PDFが2つ必要/u);
});

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

test('localized SEO titles distinguish the seven duplicate pairs without changing tool labels', async () => {
  const titlePairs = [
    { id: 'split', locales: ['es', 'pt'], titles: ['Dividir PDF por páginas y rangos', 'Dividir PDF por páginas ou intervalos'] },
    { id: 'compress', locales: ['es', 'pt'], titles: ['Comprimir PDF para reducir el tamaño', 'Comprimir PDF para reduzir o tamanho'] },
    { id: 'protect', locales: ['es', 'pt'], titles: ['Proteger PDF con contraseña', 'Proteger PDF com senha'] },
    { id: 'unlock', locales: ['es', 'pt'], titles: ['Desbloquear PDF protegido con contraseña', 'Desbloquear PDF protegido por senha'] },
    { id: 'repair', locales: ['es', 'pt'], titles: ['Intentar reparar un PDF dañado', 'Tentar reparar um PDF danificado'] },
    { id: 'compare', locales: ['es', 'pt'], titles: ['Comparar el texto de dos archivos PDF', 'Comparar o texto de dois arquivos PDF'] },
    { id: 'sign', locales: ['fr', 'no'], titles: ['Signer un PDF avec une signature visuelle', 'Signer PDF med en synlig signatur'] },
  ];

  for (const locale of Object.keys(contentByLocale)) {
    const titles = tools.map((tool) => tool.localizedTitles[locale]?.seoTitle || tool.localizedTitles[locale]?.title);
    assert.equal(new Set(titles).size, titles.length, `${locale} localized SEO title metadata is unique`);
  }

  for (const { id, locales, titles } of titlePairs) {
    const tool = tools.find((candidate) => candidate.id === id);
    assert.ok(tool, `${id} is public`);
    assert.notEqual(titles[0], titles[1], `${id} title pair is distinct`);
    for (const [index, locale] of locales.entries()) {
      const localized = tool.localizedTitles[locale];
      assert.equal(localized.seoTitle, titles[index], `${locale}:${id} has its differentiated SEO title`);
      const htmlPath = path.join(publicDir, locale, 'tools', tool.slug, 'index.html');
      const html = await readFile(htmlPath, 'utf8');
      assert.ok(html.includes(`<title>${escapeHtml(`${titles[index]} | ClickPDF`)}</title>`), `${locale}:${id} generated metadata uses the SEO title`);
      assert.ok(html.includes(`<h1>${escapeHtml(localized.title)}</h1>`), `${locale}:${id} visible H1 keeps the existing tool label`);
    }
  }
});

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
  assert.equal(tools.length, 25, 'PDF/A remains hidden while Repair and PowerPoint to PDF are public');
  assert.equal(supportedLanguageCodes.length, 21, 'the selector supports 21 languages');
  assert.equal(tools.length * supportedLanguageCodes.length, 525, 'the public tool-language matrix has 525 possible routes');
  assert.ok(tools.some((tool) => tool.id === 'repair'), 'Repair is present in the active public registry');
  assert.ok(tools.some((tool) => tool.id === 'powerpoint-to-pdf'), 'PowerPoint to PDF is present in the active public registry');

  const publicToolIds = new Set(tools.map((tool) => tool.id));
  const allContentPairs = Object.entries(contentByLocale).flatMap(([locale, localeData]) =>
    Object.keys(localeData.tools).map((toolId) => `${locale}:${toolId}`),
  ).sort();
  const contentPairs = allContentPairs.filter((pair) => publicToolIds.has(pair.slice(pair.indexOf(':') + 1)));
  const expectedPairs = Object.keys(contentByLocale).flatMap((locale) =>
    tools.map((tool) => `${locale}:${tool.id}`),
  ).sort();
  assert.deepEqual(
    contentPairs,
    expectedPairs,
    'all public tools have localized content in all 20 non-English locales',
  );

  const qaByPair = new Map(qaLedger.entries.map((entry) => [`${entry.locale}:${entry.tool}`, entry]));
  assert.equal(qaByPair.size, allContentPairs.length, 'the QA ledger retains records for public and hidden localized drafts');
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
  for (const toolId of ['repair', 'powerpoint-to-pdf']) {
    const draftEntries = qaLedger.entries.filter((entry) => entry.tool === toolId);
    assert.equal(draftEntries.length, Object.keys(contentByLocale).length, `${toolId} keeps a QA record for every non-English draft`);
    for (const entry of draftEntries) {
      assert.equal(entry.status, 'generated_draft', `${entry.locale}:${toolId} remains a generated draft`);
      assert.equal(entry.humanReviewed, false, `${entry.locale}:${toolId} does not claim human review`);
      assert.equal(entry.reviewer, null, `${entry.locale}:${toolId} has no invented reviewer identity`);
    }
  }

  const localizedToolSitemapUrls = sitemapUrls.filter((url) =>
    /^https:\/\/www\.clickpdf\.net\/[a-z]{2}\/tools\/[^/]+\/$/.test(url),
  );
  assert.equal(localizedToolSitemapUrls.length, contentPairs.length);
  assert.equal(localizedToolSitemapUrls.length, 500, 'all 25 public tools have a URL in each of 20 translated locales');
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'all sitemap URLs remain unique');

  const localizedQuestionsByLocale = new Map();
  for (const [locale, localeData] of Object.entries(contentByLocale)) {
    for (const [toolId, content] of Object.entries(localeData.tools)) {
      const tool = tools.find((item) => item.id === toolId);
      assert.ok(content.introHeading && content.intro, `${locale}:${toolId} has a localized introduction`);
      assert.equal(content.steps.length, 3, `${locale}:${toolId} has three tool-specific steps`);
      assert.equal(content.faqs.length, 6, `${locale}:${toolId} has six tool-specific FAQs`);
      assert.equal(new Set(content.faqs.map((faq) => faq.question)).size, 6, `${locale}:${toolId} FAQ questions are distinct`);
      if (!tool) {
        assert.ok(
          ['pdf-to-pdfa'].includes(toolId),
          `${locale}:${toolId} is the only intentionally hidden tool rather than missing from the active registry`,
        );
        continue;
      }
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
      if (toolId === 'repair') {
        const [noGuarantee, missingOrTruncated] = repairAccuracyMarkers[locale];
        assert.ok(tool.localizedTitles[locale].description.includes(noGuarantee), `${locale} meta description preserves the best-effort limitation`);
        assert.ok(tool.localizedTitles[locale].description.includes(missingOrTruncated), `${locale} meta description does not promise missing content recovery`);
      }
      if (toolId === 'powerpoint-to-pdf') {
        assert.ok(
          content.faqs[3].answer.includes(powerpointCharacterLimitMarkers[locale]),
          `${locale} identifies the supported character limit`,
        );
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
          zh: '任意标准 PDF',
          tl: 'karaniwang PDF',
          es: 'PDF estándar',
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
        assert.match(formulaQuestion.answer, /^(?:नहीं|لا|Non|Nein|Nee|Nej|いいえ|不会|نہیں|Hindi|Tidak|Không|No|Nei|Nie|Não|Нет|아니요|Hayır)/u, `${locale} does not claim original spreadsheet formulas are restored`);
      }
      if (toolId === 'pdf-to-powerpoint') {
        assert.match(contentText, /PPTX/i, `${locale} identifies the presentation output format`);
        const originalStructureQuestion = content.faqs.find((faq) => /मूल PowerPoint objects|عناصر PowerPoint الأصلية|objets PowerPoint d’origine|ursprünglichen PowerPoint-Objekte|元のPowerPointオブジェクト|اصل PowerPoint objects|struktur PowerPoint asli|cấu trúc bản trình chiếu gốc|struttura PowerPoint originale|opprinnelige PowerPoint-strukturen|estrutura original da apresentação PowerPoint|исходная структура PowerPoint|원래 PowerPoint 구조|Özgün PowerPoint yapısı|原始演示文稿结构|orihinal na istruktura ng presentasyon|estructura original de la presentación|oorspronkelijke presentatiestructuur|oryginalna struktura prezentacji|ursprungliga presentationsstrukturen/iu.test(faq.question));
        assert.ok(originalStructureQuestion, `${locale} explains that a PDF does not preserve the original presentation structure`);
        assert.match(originalStructureQuestion.answer, /^(?:आमतौर पर नहीं|غالبًا لا|Généralement non|Meistens nicht|通常は含まれません|عام طور پر نہیں|Tidak|Không|No|Nei|Não|Нет|아니요|Hayır|通常不会|Karaniwang hindi|Normalmente no|Meestal niet|Zwykle nie|Vanligtvis inte)/u, `${locale} avoids promising original slide objects`);
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
          zh: '输出 PDF 中的文字可以选择吗？',
          tl: 'Mapipili ba ang teksto sa nagawang PDF?',
          es: '¿Se puede seleccionar el texto del PDF resultante?',
          nl: 'Kan ik tekst in de gemaakte PDF selecteren?',
          pl: 'Czy tekst w wynikowym PDF można zaznaczyć?',
          sv: 'Går det att markera text i den skapade PDF-filen?',
        };
        const selectableQuestion = content.faqs.find((faq) => faq.question === selectableQuestionMarkers[locale]);
        assert.ok(selectableQuestion, `${locale} explains the image-based PDF text limitation`);
        const imageAnswerMarkers = { hi: 'छवियों', ar: 'صور', fr: 'images', ja: '画像', ur: 'تصاویر', de: 'Bilder', id: 'gambar', vi: 'hình ảnh', it: 'immagini', no: 'bilder', pt: 'imagens', ru: 'изображениями', ko: '이미지', tr: 'görüntü', zh: '图像', tl: 'Larawan', es: 'imágenes', nl: 'afbeeldingen', pl: 'obrazami', sv: 'bilder' };
        assert.ok(selectableQuestion.answer.includes(imageAnswerMarkers[locale]), `${locale} says output pages are images`);
      }
      if (toolId === 'word-to-excel' && ['ru', 'ko', 'tr', 'zh', 'tl', 'es', 'nl', 'pl', 'sv'].includes(locale)) {
        assert.match(contentText, /DOCX[\s\S]*XLSX/i, `${locale} identifies the DOCX input and XLSX output`);
        const extractionMarkers = {
          ru: ['отдельный лист', 'лист «Текст»'],
          ko: ['별도 XLSX 시트', '텍스트 시트'],
          tr: ['ayrı bir XLSX sayfasına', 'Metin sayfasında'],
          zh: ['单独工作表', 'Text 工作表'],
          tl: ['hiwalay na worksheet', 'Text worksheet'],
          es: ['hoja distinta', 'hoja Text'],
          nl: ['eigen werkblad', 'werkblad Tekst'],
          pl: ['osobnego arkusza', 'arkuszu Tekst'],
          sv: ['eget kalkylblad', 'Text-blad'],
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
      if (locale === 'ja' || locale === 'zh') {
        const cjkCharacterCount = (main.match(/[\u3040-\u30ff\u3400-\u9fff]/g) || []).length;
        assert.ok(
          cjkCharacterCount >= 200,
          `${localizedUrl} has ${cjkCharacterCount} visible CJK characters; Latin whitespace word counts must not classify it as a shell`,
        );
      }
      assert.match(html, new RegExp(`<html[^>]*lang=["']${locale}["']`, 'i'));
      assert.match(html, new RegExp(`<html[^>]*dir=["']${['ur', 'ar'].includes(locale) ? 'rtl' : 'ltr'}["']`, 'i'));
      assert.match(html, new RegExp(`<link rel=["']canonical["'] href=["']${localizedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`));
      const seoTitle = tool.localizedTitles[locale].seoTitle || tool.localizedTitles[locale].title;
      assert.match(html, new RegExp(`<title>${escapeHtml(`${seoTitle} | ClickPDF`)}</title>`));
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
  assert.equal(englishToolRoutes.length, tools.length);
  assert.equal(localizedToolRoutes.length, contentPairs.length);
  assert.equal(routePaths.length, tools.length + contentPairs.length, 'only English and translated routes for public tools are discoverable');
  assert.equal(tools.length * supportedLanguageCodes.length - routePaths.length, 0, 'all public tool-language routes are discoverable');

  assert.match(
    routeParserSource,
    /hasLocalizedToolPageSeoContent\(toolId,\s*language\)/,
    'manual language switching routes to a tool page only when that localized content exists',
  );
});

test('five targeted localized tool clusters have accessible crawlable language links', async () => {
  const navigationToolIds = ['word-to-excel', 'powerpoint-to-pdf', 'crop', 'repair', 'compare'];
  const targetToolIds = new Set(navigationToolIds);
  const nonEnglishLocales = supportedLanguageCodes.filter((locale) => locale !== 'en');
  const allLocales = supportedLanguageCodes;
  const localizedTargets = new Map();
  const incomingNavigationLinks = new Map();
  const expectedCanonicalAlternates = (slug) => new Map([
    ...supportedLanguageCodes.map((locale) => [
      locale,
      `${siteOrigin}/${locale === 'en' ? '' : `${locale}/`}tools/${slug}/`,
    ]),
    ['x-default', `${siteOrigin}/tools/${slug}/`],
  ]);
  const readAnchorAttributes = (html) => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => {
    const getAttribute = (name) => match[1].match(new RegExp(`(?:^|\\s)${name}=["']([^"']+)["']`, 'i'))?.[1];
    return {
      href: getAttribute('href'),
      locale: getAttribute('data-tool-language-link'),
      lang: getAttribute('lang'),
      hreflang: getAttribute('hreflang'),
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    };
  });

  for (const toolId of navigationToolIds) {
    const tool = tools.find((candidate) => candidate.id === toolId);
    assert.ok(tool, `${toolId} is a public tool`);
    const localizedContentLocales = Object.keys(contentByLocale)
      .filter((locale) => locale !== 'en' && Boolean(contentByLocale[locale]?.tools?.[toolId]))
      .sort();
    assert.deepEqual(localizedContentLocales, [...nonEnglishLocales].sort(), `${toolId} has all 20 localized routes`);

    for (const targetLocale of nonEnglishLocales) {
      localizedTargets.set(`/${targetLocale}/tools/${tool.slug}/`, `${targetLocale}:${toolId}`);
    }

    for (const locale of nonEnglishLocales) {
      const routePath = `/${locale}/tools/${tool.slug}/`;
      const pageUrl = `${siteOrigin}${routePath}`;
      const htmlPath = path.join(publicDir, locale, 'tools', tool.slug, 'index.html');
      const html = await readFile(htmlPath, 'utf8');
      const main = html.match(/<main\b(?=[^>]*\bid=["']seo-static-content["'])[^>]*>([\s\S]*?)<\/main>/i)?.[1];
      assert.ok(main, `${pageUrl} contains crawlable static HTML`);

      const navMatch = main.match(/<nav\b(?=[^>]*\bdata-tool-locale-navigation=["']true["'])[^>]*>([\s\S]*?)<\/nav>/i);
      assert.ok(navMatch, `${pageUrl} has a visible locale navigation block`);
      const navOpen = main.match(/<nav\b(?=[^>]*\bdata-tool-locale-navigation=["']true["'])[^>]*>/i)?.[0] || '';
      assert.match(navOpen, /\baria-labelledby=["']tool-locale-navigation-heading["']/i);
      assert.match(navMatch[1], /<h2\b[^>]*id=["']tool-locale-navigation-heading["'][^>]*>[^<]+<\/h2>/i);
      assert.doesNotMatch(navOpen, /\bhidden\b|aria-hidden=["']true|display\s*:\s*none/i);

      const links = readAnchorAttributes(navMatch[0]);
      const expectedLocales = allLocales.filter((candidate) => candidate !== locale).sort();
      assert.deepEqual(
        links.map((link) => link.locale).sort(),
        expectedLocales,
        `${pageUrl} links to every other available language and does not link to itself`,
      );
      for (const link of links) {
        assert.ok(link.href, `${pageUrl} has a normal anchor href`);
        assert.equal(link.lang, link.locale, `${pageUrl} marks the link text language`);
        assert.equal(link.hreflang, link.locale, `${pageUrl} declares the target language`);
        const expectedPath = link.locale === 'en'
          ? `/tools/${tool.slug}/`
          : `/${link.locale}/tools/${tool.slug}/`;
        assert.equal(link.href, expectedPath, `${pageUrl} links to the same tool's correct locale route`);
        assert.ok(link.text, `${pageUrl} has visible language link text`);
        if (localizedTargets.has(link.href)) {
          incomingNavigationLinks.set(link.href, (incomingNavigationLinks.get(link.href) || 0) + 1);
        }
      }
      assert.ok(sitemapUrlSet.has(pageUrl), `${pageUrl} remains in the sitemap`);

      const canonical = html.match(/<link rel=["']canonical["'] href=["']([^"']+)["']/i)?.[1];
      assert.equal(canonical, pageUrl, `${pageUrl} keeps its existing canonical URL`);
      const alternates = new Map(
        [...html.matchAll(/<link rel=["']alternate["'] hreflang=["']([^"']+)["'] href=["']([^"']+)["']/gi)]
          .map((match) => [match[1], match[2]]),
      );
      const expectedAlternates = expectedCanonicalAlternates(tool.slug);
      assert.equal(alternates.size, expectedAlternates.size, `${pageUrl} retains the complete hreflang set`);
      for (const [alternateLocale, alternateUrl] of expectedAlternates) {
        assert.equal(alternates.get(alternateLocale), alternateUrl, `${pageUrl} keeps its ${alternateLocale} alternate`);
      }
    }
  }

  assert.equal(localizedTargets.size, 100, 'only the 100 audited localized routes are targeted');
  for (const [targetPath, targetDescription] of localizedTargets) {
    assert.equal(incomingNavigationLinks.get(targetPath), 19, `${targetDescription} has 19 incoming locale links`);
  }

  for (const tool of tools.filter((candidate) => !targetToolIds.has(candidate.id))) {
    for (const locale of supportedLanguageCodes) {
      if (!contentByLocale[locale]?.tools?.[tool.id]) continue;
      const htmlPath = path.join(publicDir, locale, 'tools', tool.slug, 'index.html');
      const html = await readFile(htmlPath, 'utf8');
      assert.doesNotMatch(html, /\bdata-tool-locale-navigation=["']true["']/i, `${locale}:${tool.id} remains outside this navigation scope`);
    }
  }
});

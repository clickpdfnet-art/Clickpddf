import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

export const SITE_ORIGIN = 'https://www.clickpdf.net';
export const RESTORED_TOOL_IDS = ['repair', 'powerpoint-to-pdf'];
const EXPECTED_SLUGS = {
  repair: 'repair-corrupted-pdf',
  'powerpoint-to-pdf': 'powerpoint-to-pdf',
};
export const SEO_TITLE_PAIRS = [
  { toolId: 'split', locales: ['es', 'pt'] },
  { toolId: 'compress', locales: ['es', 'pt'] },
  { toolId: 'protect', locales: ['es', 'pt'] },
  { toolId: 'unlock', locales: ['es', 'pt'] },
  { toolId: 'repair', locales: ['es', 'pt'] },
  { toolId: 'compare', locales: ['es', 'pt'] },
  { toolId: 'sign', locales: ['fr', 'no'] },
];
const CJK_LOCALES = ['ja', 'zh'];

function propertyName(property, source) {
  const name = property.name;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return name ? name.getText(source).replace(/^['"]|['"]$/g, '') : '';
}

function readLiteral(node, source) {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return readLiteral(node.expression, source);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((item) => readLiteral(item, source));
  if (ts.isObjectLiteralExpression(node)) {
    const value = {};
    for (const item of node.properties) {
      if (ts.isPropertyAssignment(item)) {
        value[propertyName(item, source)] = readLiteral(item.initializer, source);
      }
    }
    return value;
  }
  if (ts.isNewExpression(node) && node.expression.getText(source) === 'Set') {
    return { __set: node.arguments?.map((argument) => readLiteral(argument, source))[0] ?? [] };
  }
  return undefined;
}

export async function readTypeScriptExport(sourcePath, exportName) {
  const sourceText = await readFile(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === exportName) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!initializer) throw new Error(`Could not read ${exportName} from ${path.basename(sourcePath)}`);
  return readLiteral(initializer, source);
}

export async function readRestoredToolPages(appDir) {
  const translationsDir = path.join(appDir, 'src', 'i18n');
  const dataDir = path.join(appDir, 'src', 'data');
  const [languages, toolTranslations, missingTranslations, seoRegistry, hiddenTools, baseTools, localizedContent, defaultSeoConfig] =
    await Promise.all([
      readTypeScriptExport(path.join(translationsDir, 'translations.ts'), 'SUPPORTED_LANGUAGES'),
      readTypeScriptExport(path.join(translationsDir, 'translations.ts'), 'TOOL_TRANSLATIONS'),
      readTypeScriptExport(path.join(translationsDir, 'missingToolTranslations.ts'), 'MISSING_TOOL_TRANSLATIONS'),
      readTypeScriptExport(path.join(dataDir, 'toolSeoData.ts'), 'TOOL_SEO_REGISTRY'),
      readTypeScriptExport(path.join(dataDir, 'toolsData.ts'), 'HIDDEN_TOOL_IDS'),
      readTypeScriptExport(path.join(dataDir, 'toolsData.ts'), 'BASE_PDF_TOOLS'),
      readFile(path.join(dataDir, 'restoredToolSeoContent.json'), 'utf8').then(JSON.parse),
      readTypeScriptExport(path.join(appDir, 'src', 'utils', 'seoManager.ts'), 'DEFAULT_SEO_CONFIG'),
    ]);

  if (!Array.isArray(languages) || languages.length !== 21) {
    throw new Error(`Expected 21 supported languages; found ${languages?.length ?? 0}.`);
  }
  const hiddenIds = new Set(hiddenTools?.__set ?? []);
  const localeCodes = languages.map((language) => language.code);
  if (new Set(localeCodes).size !== localeCodes.length || !localeCodes.includes('en')) {
    throw new Error('Supported language codes must be unique and include English.');
  }

  const publicToolIds = [...new Set((baseTools || [])
    .filter((tool) => typeof tool?.id === 'string')
    .map((tool) => tool.id))]
    .filter((toolId) => !hiddenIds.has(toolId));
  if (publicToolIds.length !== 25) {
    throw new Error(`Expected 25 public tools for the approved CJK matrix; found ${publicToolIds.length}.`);
  }
  const missingSeoIds = publicToolIds.filter((toolId) => !seoRegistry?.[toolId]);
  if (missingSeoIds.length) {
    throw new Error(`Public tools are missing SEO route records: ${missingSeoIds.join(', ')}`);
  }

  const selectedLocalesByTool = new Map(publicToolIds.map((toolId) => [toolId, new Set()]));
  for (const toolId of publicToolIds) {
    for (const locale of CJK_LOCALES) selectedLocalesByTool.get(toolId).add(locale);
  }
  for (const toolId of RESTORED_TOOL_IDS) {
    if (hiddenIds.has(toolId)) throw new Error(`Restored tool ${toolId} is still hidden.`);
    if (!selectedLocalesByTool.has(toolId)) throw new Error(`Restored tool ${toolId} is missing from the public registry.`);
    for (const locale of localeCodes) selectedLocalesByTool.get(toolId).add(locale);
  }
  for (const { toolId, locales } of SEO_TITLE_PAIRS) {
    if (!selectedLocalesByTool.has(toolId)) throw new Error(`SEO title tool ${toolId} is not public.`);
    for (const locale of locales) selectedLocalesByTool.get(toolId).add(locale);
  }

  const pages = [];
  for (const toolId of publicToolIds) {
    const seo = seoRegistry[toolId];
    if (RESTORED_TOOL_IDS.includes(toolId) && seo.slug !== EXPECTED_SLUGS[toolId]) {
      throw new Error(`Unexpected or missing canonical slug for ${toolId}.`);
    }
    const selectedLocales = selectedLocalesByTool.get(toolId);
    for (const language of languages) {
      const { code: locale } = language;
      if (!selectedLocales.has(locale)) continue;
      const translated =
        toolTranslations?.[toolId]?.[locale] ??
        missingTranslations?.[locale]?.[toolId];
      const localizedContentForTool = localizedContent?.[locale]?.tools?.[toolId];
      if (!translated?.title || !translated?.description || !localizedContentForTool) {
        throw new Error(`Incomplete localized title, description, or page content: ${locale}:${toolId}`);
      }
      const localizedContentLabels = localizedContent[locale].labels;
      const route = locale === 'en' ? `/tools/${seo.slug}/` : `/${locale}/tools/${seo.slug}/`;
      pages.push({
        toolId,
        slug: seo.slug,
        locale,
        direction: language.dir || 'ltr',
        title: translated.title,
        seoTitle: translated.seoTitle || translated.title,
        description: translated.description,
        canonical: `${SITE_ORIGIN}${route}`,
        content: localizedContentForTool,
        labels: localizedContentLabels,
        alternateLocales: [
          'en',
          ...localeCodes.filter((code) => code !== 'en' && selectedLocales.has(code)),
        ],
      });
    }
  }

  const cjkPageCount = pages.filter((page) => CJK_LOCALES.includes(page.locale)).length;
  if (cjkPageCount !== publicToolIds.length * CJK_LOCALES.length) {
    throw new Error(`Expected ${publicToolIds.length * CJK_LOCALES.length} CJK pages; found ${cjkPageCount}.`);
  }
  const targetPageCount = pages.filter((page) => RESTORED_TOOL_IDS.includes(page.toolId)).length;
  if (targetPageCount !== RESTORED_TOOL_IDS.length * localeCodes.length) {
    throw new Error(`Expected ${RESTORED_TOOL_IDS.length * localeCodes.length} restored-tool pages; found ${targetPageCount}.`);
  }

  const englishPages = [];
  for (const toolId of publicToolIds) {
    if (selectedLocalesByTool.get(toolId).has('en')) continue;
    const seo = seoRegistry[toolId];
    const translated = toolTranslations?.[toolId]?.en ?? missingTranslations?.en?.[toolId];
    if (!seo?.slug || !translated?.title || !translated?.description) {
      throw new Error(`Incomplete English route metadata for ${toolId}.`);
    }
    const englishContent = localizedContent?.en?.tools?.[toolId];
    englishPages.push({
      toolId,
      slug: seo.slug,
      locale: 'en',
      direction: 'ltr',
      title: seo.h1Title,
      seoTitle: translated.seoTitle || translated.title,
      description: englishContent?.intro || translated.description,
      canonical: `${SITE_ORIGIN}/tools/${seo.slug}/`,
      content: {
        introHeading: seo.overviewHeading,
        intro: seo.overview,
        secondaryOverview: seo.secondaryOverview,
        privacyHighlight: seo.privacyHighlight,
        benefits: seo.benefits,
        stepsHeading: seo.stepsHeading,
        steps: seo.steps.map(({ title, description }) => ({ title, description })),
        faqs: seo.faqs,
      },
      labels: localizedContent.en.labels,
      keywords: seo.keywords,
      ogImage: defaultSeoConfig.ogImage,
      toolSeo: seo,
      alternateLocales: [
        'en',
        ...localeCodes.filter((code) => code !== 'en' && selectedLocalesByTool.get(toolId).has(code)),
      ],
    });
  }
  if (englishPages.length !== 23) {
    throw new Error(`Expected 23 additional English static routes; found ${englishPages.length}.`);
  }
  const sitemapPages = [...pages, ...englishPages];

  return { languages, pages, englishPages, sitemapPages, localeCodes, publicToolIds };
}

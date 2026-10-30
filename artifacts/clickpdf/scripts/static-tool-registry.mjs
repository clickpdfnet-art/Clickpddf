import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

function propertyName(property, source) {
  const name = property.name;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return name ? name.getText(source).replace(/^['"]|['"]$/g, '') : '';
}

function readLiteral(node, source) {
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
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
  if (ts.isNewExpression(node)) {
    return {
      __constructor: node.expression.getText(source),
      values: node.arguments?.map((argument) => readLiteral(argument, source)) ?? [],
    };
  }
  return undefined;
}

export async function readTypeScriptExport(sourcePath, exportName) {
  const sourceText = await readFile(sourcePath, 'utf8');
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === exportName
    ) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!initializer) throw new Error(`Could not read ${exportName} from ${path.basename(sourcePath)}`);
  return readLiteral(initializer, source);
}

async function readPluginManifest(filePath) {
  const sourceText = await readFile(filePath, 'utf8');
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map();
  let defaultExpression;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      declarations.set(node.name.text, node.initializer);
    }
    if (ts.isExportAssignment(node)) defaultExpression = node.expression;
    ts.forEachChild(node, visit);
  }
  visit(source);

  let expression = defaultExpression;
  if (expression && ts.isIdentifier(expression)) expression = declarations.get(expression.text);
  if (!expression) {
    expression = declarations.get('plugin');
    if (!expression) return null;
  }
  const plugin = readLiteral(expression, source);
  if (!plugin?.id || !plugin?.slug || !plugin?.seo) return null;
  const seo = plugin.seo;
  return {
    id: plugin.id,
    slug: plugin.slug,
    title: plugin.title || seo.h1Title || plugin.slug,
    description: plugin.shortDescription || seo.metaDescription || '',
    seo: {
      ...seo,
      toolId: plugin.id,
      slug: plugin.slug,
      h1Title: seo.h1Title || plugin.title || plugin.slug,
      metaTitle: seo.metaTitle || `${plugin.title || plugin.slug} | ClickPDF`,
      metaDescription: seo.metaDescription || plugin.shortDescription || '',
      steps: seo.howToSteps || seo.steps || [],
      faqs: seo.faqs || [],
      benefits: seo.benefits || [],
    },
  };
}

export async function readActiveToolRegistry(appDir) {
  const dataDir = path.join(appDir, 'src', 'data');
  const toolsPath = path.join(dataDir, 'toolsData.ts');
  const seoPath = path.join(dataDir, 'toolSeoData.ts');
  const privacyPath = path.join(dataDir, 'toolPrivacyTranslations.ts');
  const pluginDir = path.join(appDir, 'src', 'tools', 'plugins');
  const [baseTools, hiddenValue, seoObject, privacyTranslations, faqTemplateText] = await Promise.all([
    readTypeScriptExport(toolsPath, 'BASE_PDF_TOOLS'),
    readTypeScriptExport(toolsPath, 'HIDDEN_TOOL_IDS'),
    readTypeScriptExport(seoPath, 'TOOL_SEO_REGISTRY'),
    readTypeScriptExport(privacyPath, 'TOOL_PRIVACY_TRANSLATIONS'),
    readFile(path.join(dataDir, 'toolSeoFaqTemplates.json'), 'utf8'),
  ]);
  const faqTemplates = JSON.parse(faqTemplateText);

  if (
    !Array.isArray(baseTools) ||
    !seoObject ||
    typeof seoObject !== 'object' ||
    !privacyTranslations?.en?.tools
  ) {
    throw new Error('Could not read the static PDF tool registry and SEO data.');
  }
  const hiddenIds = new Set(
    hiddenValue?.__constructor === 'Set' && Array.isArray(hiddenValue.values[0])
      ? hiddenValue.values[0]
      : [],
  );
  const seoById = new Map(
    Object.values(seoObject)
      .filter((seo) => seo?.toolId)
      .map((seo) => [seo.toolId, seo]),
  );

  let pluginFiles = [];
  try {
    pluginFiles = (await readdir(pluginDir))
      .filter((name) => name.endsWith('.tsx') && !name.startsWith('_') && !name.startsWith('.'))
      .sort();
  } catch {
    // The core registry remains available when the optional plugin directory is absent.
  }
  const pluginManifests = [];
  for (const fileName of pluginFiles) {
    const plugin = await readPluginManifest(path.join(pluginDir, fileName));
    if (plugin) {
      pluginManifests.push(plugin);
      seoById.set(plugin.id, plugin.seo);
    }
  }

  const publicTools = [
    ...baseTools.filter((tool) => tool?.id && !hiddenIds.has(tool.id)),
    ...pluginManifests.filter((plugin) => !hiddenIds.has(plugin.id)),
  ];

  return publicTools.map((tool) => {
    const seo = seoById.get(tool.id);
    if (!seo?.slug || !seo.steps?.length || !seo.faqs?.length) {
      throw new Error(`Public tool "${tool.id}" requires a canonical slug, HowTo steps, and FAQs.`);
    }
    const privacySummary = privacyTranslations.en.tools[tool.id];
    if (!privacySummary) {
      throw new Error(`Public tool "${tool.id}" has no English tool-specific privacy copy.`);
    }
    const faqToolName = (seo.h1Title || tool.title || 'ClickPDF')
      .split(/[—–|]/, 1)[0]
      .replace(/\b(online|free|100%|in-browser)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'ClickPDF';
    return {
      id: tool.id,
      slug: seo.slug,
      toolLabel: tool.title || seo.h1Title,
      name: seo.h1Title || tool.title || seo.metaTitle,
      title: seo.metaTitle || tool.title,
      description: seo.metaDescription || tool.description || '',
      keywords: seo.keywords || '',
      badge: seo.badge || '',
      overviewHeading: seo.overviewHeading || '',
      overview: seo.overview || '',
      secondaryOverview: seo.secondaryOverview || '',
      shortDescription: tool.description || '',
      privacySummary,
      stepsHeading: seo.stepsHeading,
      steps: seo.steps,
      faqs: tool.id === 'edit-metadata' && seo.faqs?.length
        ? seo.faqs
        : faqTemplates.faqs.map(({ question, answer }) => ({
        question: question.replaceAll('{toolName}', faqToolName),
        answer,
      })),
      directAnswerLabel: faqTemplates.directAnswerLabel,
      directAnswerSecondSentence: faqTemplates.directAnswerSecondSentence,
      benefits: seo.benefits || [],
      relatedToolIds: seo.relatedToolIds || [],
    };
  });
}

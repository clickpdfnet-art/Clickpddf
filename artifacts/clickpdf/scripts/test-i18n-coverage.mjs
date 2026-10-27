import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parse = (relativePath) => {
  const sourcePath = path.join(root, relativePath);
  const source = ts.createSourceFile(sourcePath, fs.readFileSync(sourcePath, 'utf8'), ts.ScriptTarget.Latest, true);
  return source;
};

const findVariable = (source, name) => {
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      initializer = node.initializer;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.ok(initializer, `Could not find ${name}`);
  return initializer;
};

const objectEntries = (node) => {
  assert.ok(ts.isObjectLiteralExpression(node), 'Expected an object literal');
  return new Map(node.properties
    .filter(ts.isPropertyAssignment)
    .map((property) => [property.name.getText().replaceAll(/['"]/g, ''), property.initializer]));
};

const arrayLength = (node) => {
  while (
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isParenthesizedExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    node = node.expression;
  }
  assert.ok(ts.isArrayLiteralExpression(node), 'Expected an array literal');
  return node.elements.length;
};

const translationsSource = parse('src/i18n/translations.ts');
const uiSource = parse('src/i18n/uiTranslations.ts');
const siteCopySource = parse('src/i18n/siteCopyTranslations.ts');
const toolPageSource = parse('src/i18n/toolPageTranslations.ts');
const missingToolsSource = parse('src/i18n/missingToolTranslations.ts');
const toolsSource = parse('src/data/toolsData.ts');

let localeCodes;
const visitLanguageType = (node) => {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Language' && ts.isUnionTypeNode(node.type)) {
    localeCodes = node.type.types.map((item) => item.literal?.text).filter(Boolean);
  }
  ts.forEachChild(node, visitLanguageType);
};
visitLanguageType(translationsSource);
assert.ok(localeCodes?.length === 21, `Expected 21 language codes, found ${localeCodes?.length}`);

const uiKeysCount = arrayLength(findVariable(uiSource, 'UI_KEYS'));
const siteCopyKeysCount = arrayLength(findVariable(siteCopySource, 'SITE_COPY_KEYS'));
const toolPageKeysCount = arrayLength(findVariable(toolPageSource, 'TOOL_PAGE_COPY_KEYS'));
for (const [tableName, localeTable] of [
  ['UI', objectEntries(findVariable(uiSource, 'rows'))],
  ['workspace', objectEntries(findVariable(uiSource, 'workspaceRows'))],
  ['site copy', objectEntries(findVariable(siteCopySource, 'rows'))],
  ['tool page', objectEntries(findVariable(toolPageSource, 'rows'))],
]) {
  assert.deepEqual([...localeTable.keys()].sort(), [...localeCodes].sort(), `${tableName} locales must match the supported language set`);
  for (const [locale, values] of localeTable) {
    const expectedCount =
      tableName === 'UI' ? uiKeysCount :
        tableName === 'site copy' ? siteCopyKeysCount :
          tableName === 'tool page' ? toolPageKeysCount : 25;
    assert.equal(arrayLength(values), expectedCount, `${tableName} value count mismatch for ${locale}`);
  }
}

const uiRows = objectEntries(findVariable(uiSource, 'rows'));
const englishHeadline = uiRows.get('en').elements[0].text;
assert.equal(englishHeadline, 'Free PDF tools that work in your browser');
for (const [locale, values] of uiRows) {
  if (locale === 'en') continue;
  assert.notEqual(values.elements[0].text, englishHeadline, `Homepage headline is still English for ${locale}`);
  assert.ok(!/stay safe|work safely|sicher bleiben|ابقَ آمناً|安全に、賢く|सुरक्षित रहें/i.test(values.elements[0].text), `Old homepage motto remains for ${locale}`);
}

const siteCopyRows = objectEntries(findVariable(siteCopySource, 'rows'));
const englishSiteCopy = siteCopyRows.get('en').elements;
const requiredLocalizedIndexes = [
  ...Array.from({ length: 19 }, (_, index) => index),
  ...Array.from({ length: 10 }, (_, index) => index + 19),
  30,
  31,
];
for (const [locale, values] of siteCopyRows) {
  if (locale === 'en') continue;
  for (const index of requiredLocalizedIndexes) {
    assert.notEqual(
      values.elements[index].text,
      englishSiteCopy[index].text,
      `Homepage/footer copy at index ${index} is still English for ${locale}`,
    );
  }
}

const toolPageRows = objectEntries(findVariable(toolPageSource, 'rows'));
const englishToolPageCopy = toolPageRows.get('en').elements;
for (const [locale, values] of toolPageRows) {
  if (locale === 'en') continue;
  for (let index = 0; index < toolPageKeysCount; index += 1) {
    assert.notEqual(
      values.elements[index].text,
      englishToolPageCopy[index].text,
      `Tool page copy at index ${index} is still English for ${locale}`,
    );
  }
}

const toolSeoContent = fs.readFileSync(path.join(root, 'src/components/ToolSeoContentSection.tsx'), 'utf8');
assert.ok(toolSeoContent.includes('TOOL_PAGE_TRANSLATIONS[language]'), 'Tool content must use the active language');
assert.ok(!toolSeoContent.includes('seoInfo.steps.map'), 'Tool steps must not render untranslated SEO source strings');
assert.ok(!toolSeoContent.includes('seoInfo.faqs.map'), 'Tool FAQs must not render untranslated SEO source strings');

const missingToolTable = objectEntries(findVariable(missingToolsSource, 'MISSING_TOOL_TRANSLATIONS'));
assert.deepEqual([...missingToolTable.keys()].sort(), [...localeCodes].sort(), 'Missing-tool translation locales must match supported languages');
const expectedMissingToolIds = [
  'pdf-to-image', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint',
  'word-to-pdf', 'word-to-excel', 'excel-to-pdf', 'powerpoint-to-pdf',
];
for (const [locale, localeNode] of missingToolTable) {
  const toolEntries = objectEntries(localeNode);
  for (const toolId of expectedMissingToolIds) {
    assert.ok(toolEntries.has(toolId), `Missing ${toolId} translation for ${locale}`);
    const copy = objectEntries(toolEntries.get(toolId));
    assert.ok(copy.has('title') && copy.has('description'), `Incomplete ${toolId} translation for ${locale}`);
  }
}

console.log(`i18n coverage tables passed: ${localeCodes.length} languages, ${uiKeysCount} shared UI labels, ${siteCopyKeysCount} homepage/footer strings, ${toolPageKeysCount} tool-page strings, 25 workspace labels, 8 tool cards.`);

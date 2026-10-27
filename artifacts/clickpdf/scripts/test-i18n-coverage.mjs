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
assert.equal(englishSiteCopy[27].text, 'Disclaimer', 'English footer disclaimer label must be English');
const requiredLocalizedIndexes = [
  ...Array.from({ length: 19 }, (_, index) => index),
  ...Array.from({ length: 10 }, (_, index) => index + 19),
  30,
  31,
];
for (const [locale, values] of siteCopyRows) {
  if (locale === 'en') continue;
  for (const index of requiredLocalizedIndexes) {
    if (locale === 'nl' && index === 27) {
      assert.equal(values.elements[index].text, 'Disclaimer', 'Dutch may use the same word for Disclaimer');
      continue;
    }
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

const legalPageDefinitions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/legalPages.json'), 'utf8'));
const legalPageTranslations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/legalPageTranslations.json'), 'utf8'));
const legalInterfaceTranslations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/legalInterfaceTranslations.json'), 'utf8'));
const legalIds = legalPageDefinitions.map((page) => page.id).sort();
assert.equal(legalIds.length, 6, 'All six public legal pages must be represented');
assert.deepEqual(Object.keys(legalPageTranslations).sort(), [...localeCodes].sort(), 'Legal page translations must cover all supported locales');
assert.deepEqual(Object.keys(legalInterfaceTranslations).sort(), [...localeCodes].sort(), 'Legal modal labels must cover all supported locales');

const englishLegalPageTranslations = legalPageTranslations.en;
const legalInterfaceKeys = Object.keys(legalInterfaceTranslations.en).sort();
for (const locale of localeCodes) {
  assert.deepEqual(Object.keys(legalPageTranslations[locale]).sort(), legalIds, `Legal page set mismatch for ${locale}`);
  assert.deepEqual(Object.keys(legalInterfaceTranslations[locale]).sort(), legalInterfaceKeys, `Legal interface keys mismatch for ${locale}`);

  for (const page of legalPageDefinitions) {
    const copy = legalPageTranslations[locale][page.id];
    assert.ok(copy.heading.trim() && copy.description.trim(), `Missing legal heading or description for ${locale}/${page.id}`);
    assert.equal(copy.sections.length, page.sections.length, `Legal section count mismatch for ${locale}/${page.id}`);
    copy.sections.forEach((section, sectionIndex) => {
      assert.ok(section.heading.trim(), `Missing legal section heading for ${locale}/${page.id}/${sectionIndex}`);
      assert.equal(
        section.paragraphs.length,
        page.sections[sectionIndex].paragraphs.length,
        `Legal paragraph count mismatch for ${locale}/${page.id}/${sectionIndex}`,
      );
      section.paragraphs.forEach((paragraph) => assert.ok(paragraph.trim(), `Empty legal paragraph for ${locale}/${page.id}`));
    });

    if (locale !== 'en') {
      const sameHeadingIsValid = page.id === 'disclaimer' && ['nl', 'tl'].includes(locale);
      if (!sameHeadingIsValid) {
        assert.notEqual(copy.heading, englishLegalPageTranslations[page.id].heading, `Legal heading is still English for ${locale}/${page.id}`);
      }
      assert.notEqual(copy.description, englishLegalPageTranslations[page.id].description, `Legal description is still English for ${locale}/${page.id}`);
    }
  }

  for (const [key, value] of Object.entries(legalInterfaceTranslations[locale])) {
    assert.equal(typeof value, 'string', `Legal UI value must be text for ${locale}/${key}`);
    assert.ok(value.trim(), `Legal UI value is empty for ${locale}/${key}`);
  }
  assert.ok(legalInterfaceTranslations[locale].successBody.includes('{name}'), `Success-message placeholder missing for ${locale}`);
}

const legalPageComponent = fs.readFileSync(path.join(root, 'src/components/LegalPage.tsx'), 'utf8');
const legalModalComponent = fs.readFileSync(path.join(root, 'src/components/LegalModal.tsx'), 'utf8');
assert.ok(legalPageComponent.includes('getLocalizedLegalPage'), 'Standalone legal pages must use the selected language');
assert.ok(legalModalComponent.includes('getLocalizedLegalPage'), 'Legal modal tabs must use the selected language');

console.log(`i18n coverage tables passed: ${localeCodes.length} languages, ${uiKeysCount} shared UI labels, ${siteCopyKeysCount} homepage/footer strings, ${toolPageKeysCount} tool-page strings, 25 workspace labels, 8 tool cards.`);

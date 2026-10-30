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
const blogInterfaceSource = parse('src/i18n/blogInterfaceTranslations.ts');
const floatingUiSource = parse('src/i18n/floatingUiTranslations.ts');
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

const initialLanguageSourcePath = path.join(root, 'src/i18n/resolveInitialLanguage.ts');
const initialLanguageSource = fs.readFileSync(initialLanguageSourcePath, 'utf8');
const transpiledInitialLanguage = ts.transpileModule(initialLanguageSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const initialLanguageModule = { exports: {} };
new Function('module', 'exports', 'require', transpiledInitialLanguage)(
  initialLanguageModule,
  initialLanguageModule.exports,
  (modulePath) => {
    assert.equal(modulePath, './translations');
    return { SUPPORTED_LANGUAGES: localeCodes.map((code) => ({ code })) };
  },
);
const { resolveInitialLanguage } = initialLanguageModule.exports;
for (const locale of localeCodes) {
  assert.equal(resolveInitialLanguage(locale), locale, `Saved manual preference should preserve ${locale}`);
}
assert.equal(resolveInitialLanguage(null), 'en', 'A new visitor must default to English');
assert.equal(resolveInitialLanguage(undefined), 'en', 'A missing saved preference must default to English');
assert.equal(resolveInitialLanguage('invalid'), 'en', 'An invalid saved preference must default to English');

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

const blogInterfaceRows = objectEntries(findVariable(blogInterfaceSource, 'BLOG_INTERFACE_TRANSLATIONS'));
assert.deepEqual(
  [...blogInterfaceRows.keys()].sort(),
  [...localeCodes].sort(),
  'Blog interface translations must cover every supported language',
);
const englishBlogInterface = objectEntries(blogInterfaceRows.get('en'));
for (const [locale, localeNode] of blogInterfaceRows) {
  const localized = objectEntries(localeNode);
  assert.deepEqual(
    [...localized.keys()].sort(),
    [...englishBlogInterface.keys()].sort(),
    `Blog interface labels are incomplete for ${locale}`,
  );
  if (locale === 'en') continue;
  for (const [key, value] of localized) {
    assert.ok(ts.isStringLiteralLike(value), `Blog interface ${key} must be plain text for ${locale}`);
    assert.notEqual(
      value.text,
      englishBlogInterface.get(key).text,
      `Blog interface ${key} is still English for ${locale}`,
    );
  }
}

const floatingUiRows = objectEntries(findVariable(floatingUiSource, 'FLOATING_UI_TRANSLATIONS'));
assert.deepEqual(
  [...floatingUiRows.keys()].sort(),
  [...localeCodes].sort(),
  'Floating controls must have translations for every supported language',
);
const englishFloatingUi = objectEntries(floatingUiRows.get('en'));
for (const [locale, localeNode] of floatingUiRows) {
  const localized = objectEntries(localeNode);
  assert.deepEqual(
    [...localized.keys()].sort(),
    [...englishFloatingUi.keys()].sort(),
    `Floating control translations are incomplete for ${locale}`,
  );
  if (locale === 'en') continue;
  for (const [key, value] of localized) {
    assert.ok(ts.isStringLiteralLike(value), `Floating control ${key} must be plain text for ${locale}`);
    assert.notEqual(
      value.text,
      englishFloatingUi.get(key).text,
      `Floating control ${key} is still English for ${locale}`,
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
const blogSection = fs.readFileSync(path.join(root, 'src/components/BlogSection.tsx'), 'utf8');
const header = fs.readFileSync(path.join(root, 'src/components/Header.tsx'), 'utf8');
const floatingShareButton = fs.readFileSync(path.join(root, 'src/components/FloatingShareButton.tsx'), 'utf8');
const keyboardShortcutsHint = fs.readFileSync(path.join(root, 'src/components/KeyboardShortcutsHint.tsx'), 'utf8');
const toolWorkspace = fs.readFileSync(path.join(root, 'src/components/ToolWorkspace.tsx'), 'utf8');
const mobileDrawer = fs.readFileSync(path.join(root, 'src/components/MobileDrawer.tsx'), 'utf8');
const languageContext = fs.readFileSync(path.join(root, 'src/context/LanguageContext.tsx'), 'utf8');
assert.ok(
  languageContext.includes('resolveInitialLanguage(savedLanguage)'),
  'Language context must resolve only from the saved selection',
);
assert.doesNotMatch(
  languageContext,
  /\bnavigator\.(?:languages|language)\b/,
  'Language context must ignore browser locale when selecting the initial language',
);
assert.ok(languageContext.includes("localStorage.getItem(LANG_STORAGE_KEY)"), 'Saved language preference must still be read');
assert.ok(languageContext.includes("localStorage.setItem(LANG_STORAGE_KEY, lang)"), 'Manual language selection must still be saved');

const routeParser = fs.readFileSync(path.join(root, 'src/utils/routeParser.ts'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
assert.ok(
  routeParser.includes('return { view: \'tool\', toolId: seoInfo.toolId, locale };'),
  'Explicit localized tool URLs must keep returning their locale',
);
assert.ok(
  appSource.includes('if (route.locale) setLanguage(route.locale);'),
  'An explicit localized tool URL must apply its locale',
);
assert.ok(
  appSource.includes('setLanguage(match.locale as Language);'),
  'An explicit localized blog URL must apply its locale',
);
for (const key of [
  'blogTag',
  'blogTitle',
  'blogSubtitle',
  'readBtn',
  'backToTools',
  'browserBasedFileProcessing',
  'recommendedFreeTool',
  'relatedToolNotice',
  'relatedPdfToolLabel',
  'readingProgressLabel',
  'readingProgressAriaLabel',
  'closeArticleLabel',
]) {
  assert.ok(blogSection.includes(`t.${key}`), `Blog section must use the localized ${key} label`);
}
assert.ok(header.includes('t.shareClickPdf'), 'Header share button must use the localized label');
assert.ok(floatingShareButton.includes('t.shareLabel'), 'Floating share button must use its localized short label');
assert.ok(floatingShareButton.includes('t.shareClickPdf'), 'Floating share button accessibility labels must be localized');
assert.ok(toolWorkspace.includes('t.shareLabel'), 'Tool result share button must use its localized label');
assert.ok(toolWorkspace.includes('aria-label={t.shareClickPdf}'), 'Tool result share button accessibility label must be localized');
for (const key of [
  'shortcutsHintAriaLabel',
  'shortcutsHintTitle',
  'shortcutsLabel',
  'shortcutsOr',
  'shortcutsCheatsheet',
  'dismissShortcutsHint',
]) {
  assert.ok(keyboardShortcutsHint.includes(`t.${key}`), `Keyboard shortcut hint must use the localized ${key} label`);
}
assert.ok(blogSection.includes("t.readingProgressLabel.replace('{percent}'"), 'Reading progress must use its localized label');
assert.ok(!blogSection.includes('Recommended Free Tool'), 'Blog tool card must not hardcode its English recommendation label');
assert.ok(!blogSection.includes('Browser-Based File Processing'), 'Blog tool card must not hardcode its English processing label');
assert.ok(!blogSection.includes('Open the related tool in your browser.'), 'Blog tool card notice must be localized');
assert.ok(
  languageContext.indexOf('...WORKSPACE_TRANSLATIONS[language]') <
    languageContext.indexOf('...BLOG_INTERFACE_TRANSLATIONS[language]'),
  'Blog interface labels must override generic workspace copy',
);
for (const key of ['aboutUs', 'contactUs', 'cookiesPolicy', 'privacyPolicy', 'termsOfService', 'disclaimer']) {
  assert.ok(mobileDrawer.includes(`t.${key}`), `Mobile drawer must use the localized ${key} label`);
}
assert.ok(mobileDrawer.includes("onOpenLegal('disclaimer')"), 'Mobile drawer must link to the disclaimer page');
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

const faqSource = fs.readFileSync(path.join(root, 'src/data/faqData.ts'), 'utf8');
const faqIds = [...faqSource.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]).sort();
const faqPageTranslations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/faqPageTranslations.json'), 'utf8'));
const batchQueueTranslations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/batchQueueTranslations.json'), 'utf8'));
const installModalTranslations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/installModalTranslations.json'), 'utf8'));
for (const [tableName, table] of [
  ['FAQ page', faqPageTranslations],
  ['batch queue', batchQueueTranslations],
  ['install modal', installModalTranslations],
]) {
  assert.deepEqual(Object.keys(table).sort(), [...localeCodes].sort(), `${tableName} locales must match supported languages`);
}
for (const locale of localeCodes) {
  const faqCopy = faqPageTranslations[locale];
  assert.deepEqual(Object.keys(faqCopy.ui).sort(), Object.keys(faqPageTranslations.en.ui).sort(), `FAQ UI keys mismatch for ${locale}`);
  assert.ok(faqCopy.ui.title.trim() && faqCopy.ui.description.trim(), `FAQ heading/description missing for ${locale}`);
  assert.ok(faqCopy.ui.showingQuestions.includes('{count}'), `FAQ count placeholder missing for ${locale}`);
  assert.ok(faqCopy.ui.readTime.includes('{minutes}'), `FAQ reading-time placeholder missing for ${locale}`);
  if (locale !== 'en') {
    assert.deepEqual(Object.keys(faqCopy.items).sort(), faqIds, `FAQ records mismatch for ${locale}`);
    for (const id of faqIds) {
      const item = faqCopy.items[id];
      assert.ok(item.question.trim() && item.answer.trim() && item.categoryLabel.trim(), `FAQ text missing for ${locale}/${id}`);
      assert.ok(Array.isArray(item.highlights) && item.highlights.length > 0, `FAQ highlights missing for ${locale}/${id}`);
    }
    assert.notEqual(faqCopy.ui.title, faqPageTranslations.en.ui.title, `FAQ title is still English for ${locale}`);
  } else {
    assert.deepEqual(Object.keys(faqCopy.items), [], 'English FAQ content should continue using the canonical source data');
  }

  for (const [name, table, requiredKeys] of [
    ['batch queue', batchQueueTranslations, ['title', 'dropTitle', 'emptyQueueTitle', 'startProcessing', 'downloadAllZip']],
    ['install modal', installModalTranslations, ['title', 'quickDescription', 'chromeDescription', 'androidDescription', 'iphoneDescription']],
  ]) {
    for (const [key, value] of Object.entries(table[locale])) {
      assert.equal(typeof value, 'string', `${name} value must be text for ${locale}/${key}`);
      assert.ok(value.trim(), `${name} value is empty for ${locale}/${key}`);
    }
    for (const key of requiredKeys) assert.ok(table[locale][key], `Missing ${name} text for ${locale}/${key}`);
  }
}

assert.ok(fs.readFileSync(path.join(root, 'src/components/FaqSection.tsx'), 'utf8').includes('FAQ_PAGE_TRANSLATIONS[language]'));
assert.ok(fs.readFileSync(path.join(root, 'src/components/BatchQueueView.tsx'), 'utf8').includes('BATCH_QUEUE_TRANSLATIONS[language]'));
assert.ok(fs.readFileSync(path.join(root, 'src/components/PWAInstallButton.tsx'), 'utf8').includes('INSTALL_MODAL_TRANSLATIONS[language]'));

console.log(`i18n coverage passed: ${localeCodes.length} languages, ${uiKeysCount} shared UI labels, ${siteCopyKeysCount} homepage/footer strings, ${toolPageKeysCount} tool-page strings, 6 legal pages, 9 FAQs, batch queue, install modal.`);

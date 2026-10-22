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
  while (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  assert.ok(ts.isArrayLiteralExpression(node), 'Expected an array literal');
  return node.elements.length;
};

const translationsSource = parse('src/i18n/translations.ts');
const uiSource = parse('src/i18n/uiTranslations.ts');
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
for (const [tableName, localeTable] of [
  ['UI', objectEntries(findVariable(uiSource, 'rows'))],
  ['workspace', objectEntries(findVariable(uiSource, 'workspaceRows'))],
]) {
  assert.deepEqual([...localeTable.keys()].sort(), [...localeCodes].sort(), `${tableName} locales must match the supported language set`);
  for (const [locale, values] of localeTable) {
    assert.equal(arrayLength(values), tableName === 'UI' ? uiKeysCount : 25, `${tableName} value count mismatch for ${locale}`);
  }
}

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

console.log(`i18n coverage tables passed: ${localeCodes.length} languages, ${uiKeysCount} shared UI labels, 25 workspace labels, 8 tool cards.`);

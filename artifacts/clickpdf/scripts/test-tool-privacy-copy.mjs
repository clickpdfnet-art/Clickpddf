import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { readActiveToolRegistry, readTypeScriptExport } from './static-tool-registry.mjs';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = path.resolve(appDir, '../..');
const tablePath = path.join(appDir, 'src/data/toolPrivacyTranslations.ts');
const supportedLanguagesPath = path.join(appDir, 'src/i18n/translations.ts');
const expectedToolIds = [
  'merge', 'split', 'compress', 'jpg-to-pdf', 'pdf-to-image', 'rotate', 'watermark',
  'page-numbers', 'organize', 'edit-metadata', 'metadata', 'protect', 'unlock',
  'pdf-to-text', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'word-to-pdf',
  'word-to-excel', 'excel-to-pdf', 'sign',
];
const newlyEnabledToolIds = ['crop', 'repair', 'compare', 'powerpoint-to-pdf'];

const englishExpected = {
  merge: 'Combines selected PDF files in the order you choose. Review links, forms, and annotations in the merged file because interactive features can vary by source document.',
  split: 'Extracts the page ranges you select into separate PDF files or a ZIP. Check the selected page numbers and output order; very large files may be limited by available browser memory.',
  compress: 'Compresses the selected PDF using the chosen settings. File-size reduction and visual quality depend on the original file; compare the result with your original before replacing it.',
  'jpg-to-pdf': 'Combines selected JPG, PNG, or WebP images into PDF pages. Review image order, page size, margins, and fit before saving.',
  'pdf-to-image': 'Renders PDF pages as PNG images. The exported images do not contain selectable PDF text, and high-resolution or multi-page files can use substantial device memory.',
  rotate: 'Rotates the pages you select in the PDF. Preview the saved copy to confirm every page has the intended orientation.',
  watermark: 'Adds a visible text watermark with settings such as angle, size, and opacity. A watermark does not encrypt the PDF or prevent someone from copying its contents.',
  'page-numbers': 'Adds page numbers in the selected header or footer position. Check the starting number and placement for overlap with existing page content.',
  organize: 'Lets you reorder, rotate, or remove pages in a new PDF copy. Removing a page is not secure redaction and does not securely erase the original file.',
  'edit-metadata': 'Edits or clears the supported Title, Author, Subject, Keywords, Creator, and Producer fields. This does not redact visible content or guarantee removal of every hidden data item.',
  metadata: 'Counts pages, checks page dimensions, and can run Tesseract.js OCR on scanned pages. OCR accuracy depends on scan quality and language; OCR language resources may need to load.',
  protect: 'Uses AES-256-GCM in the browser to create a ClickPDF-protected package. This is not a standard PDF open-password file; keep the password and use ClickPDF Unlock to reopen it.',
  unlock: 'Reopens files protected with ClickPDF Protect PDF when you enter the correct password. It is not a promise that every password or restriction from other PDF apps can be removed.',
  'pdf-to-text': 'Extracts selectable PDF text into text or Markdown. Scanned image-only pages need OCR, and the exported reading order or formatting may differ from the original.',
  'pdf-to-word': 'Converts PDF content into an editable DOCX file. Fonts, spacing, complex layouts, and scanned or image-only pages may differ from the original; review the output and quality report.',
  'pdf-to-excel': 'Detects tables and data in a PDF and exports them to XLSX. Complex layouts or scanned pages may produce missing or shifted cells, so verify values and totals.',
  'pdf-to-powerpoint': 'Rebuilds PDF content as editable widescreen PowerPoint slides. The result may not reproduce the original design, fonts, or layout exactly; inspect each slide before presenting.',
  'word-to-pdf': 'Converts DOCX content into A4 PDF pages. Page breaks, fonts, tables, and embedded images can render differently from Word, so inspect the saved PDF.',
  'word-to-excel': 'Places Word tables into Excel worksheets and keeps document text or lists in a separate worksheet. Review complex or merged tables and the extracted text.',
  'excel-to-pdf': 'Renders spreadsheet content as styled, paginated PDF tables. Check scaling, column widths, and page breaks, especially for wide sheets.',
  sign: 'Places a drawn, typed, or stamped visual signature on PDF pages. This is not a certificate-backed digital signature or identity verification.',
  crop: 'Changes the PDF CropBox uniformly on all four sides. Content outside the CropBox is not deleted, so this is not secure redaction.',
  repair: 'Attempts to re-save and reopen a PDF that the parser can read. Recovery is best-effort and cannot restore missing or truncated content.',
  compare: 'Compares selectable text from exactly two PDFs page by page. It does not compare images, visual layout, or scanned text without OCR.',
  'powerpoint-to-pdf': 'Extracts selectable text from PPTX files into basic PDF pages. Original slide artwork, layout, charts, notes, and animations are not preserved.',
};

const urduExpected = {
  merge: 'منتخب PDF فائلوں کو آپ کی چنی ہوئی ترتیب سے ملاتا ہے۔ تیار فائل میں links، forms اور annotations دیکھیں، کیونکہ interactive features اصل document کے لحاظ سے مختلف ہو سکتے ہیں۔',
  'edit-metadata': 'معاون Title، Author، Subject، Keywords، Creator اور Producer fields کو تبدیل یا صاف کرتا ہے۔ یہ نظر آنے والے مواد کو redact نہیں کرتا اور نہ ہر hidden data item کے ہٹنے کی ضمانت دیتا ہے۔',
  metadata: 'صفحات گنتا، ان کے dimensions چیک کرتا، اور scanned صفحات پر Tesseract.js OCR چلا سکتا ہے۔ OCR کی درستگی scan quality اور زبان پر منحصر ہے؛ زبان کے OCR resources لوڈ ہونے میں وقت لگ سکتا ہے۔',
  sign: 'PDF صفحات پر ہاتھ سے بنائے، ٹائپ کیے یا stamp کیے ہوئے بصری دستخط رکھتا ہے۔ یہ certificate پر مبنی digital signature یا شناخت کی تصدیق نہیں ہے۔',
};

const source = ts.createSourceFile(
  supportedLanguagesPath,
  await readFile(supportedLanguagesPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
let supportedLanguages = [];
function findLanguageUnion(node) {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === 'Language' && ts.isUnionTypeNode(node.type)) {
    supportedLanguages = node.type.types.map((member) => member.literal?.text).filter(Boolean);
  }
  ts.forEachChild(node, findLanguageUnion);
}
findLanguageUnion(source);

const translations = await readTypeScriptExport(tablePath, 'TOOL_PRIVACY_TRANSLATIONS');
const localizedSeo = JSON.parse(await readFile(path.join(appDir, 'src/i18n/toolSeoContentTranslations.json'), 'utf8'));
assert.equal(supportedLanguages.length, 21, 'The project must keep its 21 supported languages.');
assert.deepEqual(
  Object.keys(translations).sort(),
  [...supportedLanguages].sort(),
  'Tool privacy translations must cover every and only supported language.',
);

for (const [language, locale] of Object.entries(translations)) {
  assert.deepEqual(Object.keys(locale).sort(), ['tools'], `Unexpected shared copy remains for ${language}.`);
  const legacyLocaleTools = Object.keys(locale.tools).filter((id) => expectedToolIds.includes(id));
  assert.deepEqual(
    legacyLocaleTools.sort(),
    [...expectedToolIds].sort(),
    `Tool IDs must match all 21 live public tools for ${language}.`,
  );
  assert.equal(new Set(Object.values(locale.tools)).size, Object.keys(locale.tools).length, `Tool copy must be tool-specific for ${language}.`);
  for (const toolId of expectedToolIds) {
    assert.ok(locale.tools[toolId].trim(), `Missing ${language}/${toolId} summary.`);
  }
  for (const toolId of newlyEnabledToolIds) {
    assert.ok(
      (locale.tools[toolId] ?? localizedSeo[language]?.tools?.[toolId]?.intro)?.trim(),
      `Missing generated ${language}/${toolId} privacy summary.`,
    );
  }
}

assert.deepEqual(
  translations.en.tools,
  englishExpected,
  'English tool copy must match the approved source wording exactly.',
);
for (const [toolId, expected] of Object.entries(urduExpected)) {
  assert.equal(translations.ur.tools[toolId], expected, `Urdu copy must be mapped to ${toolId}.`);
}

const transpiled = ts.transpileModule(await readFile(tablePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const privacyModule = { exports: {} };
const privacyRequire = createRequire(tablePath);
const privacyModuleRequire = (specifier) => {
  const loaded = privacyRequire(specifier);
  return specifier.endsWith('.json') ? { default: loaded } : loaded;
};
new Function('module', 'exports', 'require', transpiled)(privacyModule, privacyModule.exports, privacyModuleRequire);
const getCopy = privacyModule.exports.getToolPrivacyCopy;
for (const language of supportedLanguages) {
  for (const toolId of [...expectedToolIds, ...newlyEnabledToolIds]) {
    const copy = getCopy(language, toolId);
    const expectedSummary = translations[language].tools[toolId] ?? localizedSeo[language]?.tools?.[toolId]?.intro;
    assert.equal(copy.summary, expectedSummary, `Runtime copy mismatch at ${language}/${toolId}.`);
    assert.deepEqual(Object.keys(copy), ['summary'], `Unexpected extra copy returned for ${language}/${toolId}.`);
  }
}
assert.ok(getCopy('ur', 'crop').summary, 'Generated localized privacy copy must be available for new public tools.');

const componentSource = await readFile(path.join(appDir, 'src/components/ToolSeoContentSection.tsx'), 'utf8');
assert.match(componentSource, /getToolPrivacyCopy\(language,\s*tool\.id\)/);
assert.match(componentSource, /\{toolPrivacyCopy\.summary\}/);
assert.doesNotMatch(componentSource, /toolPrivacyCopy\.disclosure/);
assert.doesNotMatch(componentSource, /copy\.privacySummary/);
assert.doesNotMatch(componentSource, /copy\.aboutToolSummary/);
assert.doesNotMatch(componentSource, /ui\.aboutToolSectionHeading/);
assert.match(componentSource, /\{seoInfo\.overview\}/, 'The metadata tool’s specific overview must remain.');
assert.match(componentSource, /\{seoInfo\.secondaryOverview\}/, 'The metadata tool’s specific warning must remain.');
assert.doesNotMatch(componentSource, /isEnglishMetadataPage\s*\?\s*seoInfo\.metaDescription/);

const activeTools = await readActiveToolRegistry(appDir);
assert.deepEqual(activeTools.map((tool) => tool.id).sort(), [...expectedToolIds, ...newlyEnabledToolIds].sort());
const oldGenericParagraph = 'Your document is processed locally in your browser. The page may still load standard resources and enabled third-party services, such as ads.';
const removedDisclosure = 'The page may still load standard resources and enabled third-party services, including ads.';
for (const tool of activeTools) {
  assert.equal(tool.privacySummary, englishExpected[tool.id], `${tool.id} static registry summary differs from English source.`);
  const htmlPath = path.join(appDir, 'dist/public/tools', tool.slug, 'index.html');
  const html = await readFile(htmlPath, 'utf8');
  assert.ok(html.includes(tool.privacySummary), `${tool.slug} static fallback is missing its tool-specific summary.`);
  assert.ok(!html.includes(removedDisclosure), `${tool.slug} still contains the removed resource disclosure.`);
  assert.ok(!html.includes(oldGenericParagraph), `${tool.slug} still contains the repeated generic paragraph.`);
}

console.log(`Validated unique tool copy for ${expectedToolIds.length} tools in ${supportedLanguages.length} languages, confirmed the removed sections stay hidden, and checked all ${activeTools.length} generated static tool pages.`);

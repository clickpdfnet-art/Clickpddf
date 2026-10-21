import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
import JSZip from 'jszip';

const asModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const geometryUrl = asModule(compile(await readFile(new URL('../src/utils/pdfWordGeometry.ts', import.meta.url), 'utf8')));
const geometry = await import(geometryUrl);
const runtimeUrl = asModule(compile(await readFile(new URL('../src/utils/pdfWordRuntimeChecks.ts', import.meta.url), 'utf8')));
const builderSource = compile(await readFile(new URL('../src/utils/pdfWordDocx.ts', import.meta.url), 'utf8'))
  .replace(/from ['"]([^'"]+)['"]/g, (_, name) => `from '${name === './pdfWordGeometry' ? geometryUrl :
    name === './pdfWordRuntimeChecks' ? runtimeUrl : import.meta.resolve(name)}'`);
const { buildAdvancedWord } = await import(asModule(builderSource));
const span = (text, x, y, extra = {}) => ({
  text, x, y, width: text.length * 6, height: 12, size: 12, font: 'Arial',
  color: '194DB3', bold: false, italic: false, rtl: false, ...extra
});
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jB1sAAAAASUVORK5CYII=', 'base64'));
const page = (number, spans, extra = {}) => ({
  number, width: 612, height: 792, lines: geometry.groupWordLines(spans),
  artwork: [], ruled: false, ocr: false, warnings: [], ...extra
});
const fixtures = [
  page(1, [
    span('Report Heading', 50, 40, { size: 24, height: 24, bold: true }),
    span('Editable paragraph with a hyperlink.', 50, 90, { link: 'https://example.com/', italic: true }),
    span('اردو زبان', 350, 130, { rtl: true, font: 'Arial' }),
    span('日本語の文章', 50, 170, { font: 'Yu Mincho' })
  ], { artwork: [{ data: png, x: 450, y: 20, width: 80, height: 40, role: 'image' }] }),
  page(2, [span('Landscape page', 45, 50)], { width: 842, height: 595 }),
  page(3, [], { warnings: ['Blank source page retained.'] })
];

test('layout DOCX retains Unicode text, editable textboxes and no forced page rasterization', async () => {
  const result = await buildAdvancedWord(fixtures, { mode: 'layout', imageFallback: 'never' }, 'Layout test');
  const zip = await JSZip.loadAsync(result.data);
  const xml = await zip.file('word/document.xml').async('string');
  assert.match(xml, /<w:txbxContent>/);
  assert.match(xml, /<w:txbxContent><w:p>/);
  assert.match(xml.replace(/<[^>]*>/g, ''), /اردو زبان/); assert.match(xml, /日本語の文章/);
  assert.match(xml, /filled="f" stroked="f"/); assert.match(xml, /inset="0,0,0,0"/);
  assert.equal((xml.match(/<w:sectPr>/g) || []).length, 3);
  assert.match(xml, /w:w="16840" w:h="11900" w:orient="landscape"/);
  assert.equal(result.report.fallbackPages.length, 0);
  assert.equal(result.report.pages[0].images, 1);
  assert.ok(Object.keys(zip.files).some(name => name.startsWith('word/media/') && !zip.files[name].dir));
  assert.ok(zip.file('clickpdf/conversion-report.json'));
  assert.match(await zip.file('[Content_Types].xml').async('string'), /Extension="json" ContentType="application\/json"/);
});

test('DOCX generation observes cancellation between page sections', async () => {
  const controller = new AbortController();
  const pending = buildAdvancedWord(Array.from({ length: 8 }, (_, index) => page(index + 1,
    [span(`Page ${index + 1}`, 50, 50)])), { mode: 'layout', imageFallback: 'never' }, 'Cancel test', controller.signal);
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(pending, { name: 'AbortError' });
});

test('editable DOCX keeps styles, hyperlinks, script direction and genuine sections', async () => {
  const result = await buildAdvancedWord(fixtures, { mode: 'editable', imageFallback: 'never' }, 'Editable test');
  const zip = await JSZip.loadAsync(result.data), xml = await zip.file('word/document.xml').async('string');
  assert.doesNotMatch(xml, /<w:txbxContent>/);
  assert.match(xml, /w:color w:val="194DB3"/);
  assert.match(xml, /<w:b\/>/); assert.match(xml, /<w:i\/>/);
  assert.match(xml, /<w:rtl\/>/); assert.match(xml, /<w:bidi\/>/);
  assert.match(xml, /w:eastAsia="Yu Mincho"/);
  assert.match(await zip.file('word/_rels/document.xml.rels').async('string'), /https:\/\/example.com\//);
  assert.doesNotMatch(xml, /--- Page Break/);
  assert.equal((xml.match(/<w:sectPr>/g) || []).length, 3);
});

test('simple ruled tables are native editable Word cells, not duplicated text', async () => {
  const model = page(1, [
    span('Name', 50, 100), span('Value', 240, 100),
    span('Alpha', 50, 130), span('Forty two', 240, 130)
  ], { ruled: true });
  const result = await buildAdvancedWord([model], { mode: 'layout', imageFallback: 'never' }, 'Table test');
  const xml = await (await JSZip.loadAsync(result.data)).file('word/document.xml').async('string');
  assert.match(xml, /<w:tbl>/); assert.match(xml, /<w:tblpPr/);
  assert.equal((xml.match(/<w:t[^>]*>Alpha<\/w:t>/g) || []).length, 1);
  assert.equal(result.report.pages[0].tables, 1);
});

test('image-only fallback is explicit in the report and does not duplicate hidden text', async () => {
  const imagePage = page(1, [], { artwork: [{ data: png, x: 0, y: 0, width: 612, height: 792, role: 'page-image' }] });
  const result = await buildAdvancedWord([imagePage], { mode: 'layout', imageFallback: 'all' }, 'Fallback');
  const xml = await (await JSZip.loadAsync(result.data)).file('word/document.xml').async('string');
  assert.deepEqual(result.report.fallbackPages, [1]);
  assert.doesNotMatch(xml, /<w:txbxContent>/);
  assert.equal(result.report.pages[0].textLines, 0);
});

test('line grouping preserves RTL and keeps table detection conservative', () => {
  const lines = geometry.groupWordLines([span('دنیا', 200, 50, { rtl: true }), span('سلام', 300, 50, { rtl: true })]);
  assert.equal(lines[0].spans[0].text, 'سلام');
  assert.equal(geometry.findRuledTables(lines, false).length, 0);
  assert.equal(geometry.safeWordFont('ABCDEE+Helvetica-Bold', 'English').font, 'Arial');
  assert.equal(geometry.safeWordFont('Unknown', '日本語').font, 'Yu Mincho');
});

test('editable lists use native Word numbering without doubled visible list markers', async () => {
  const result = await buildAdvancedWord([page(1, [span('3. Third item', 50, 50), span('4. Fourth item', 50, 75),
    span('• Bullet item', 50, 110)])], { mode: 'editable', imageFallback: 'never' }, 'Lists');
  const zip = await JSZip.loadAsync(result.data), xml = await zip.file('word/document.xml').async('string');
  assert.equal((xml.match(/<w:numPr>/g) || []).length, 3);
  assert.doesNotMatch(xml, /3\. Third item/);
  assert.match(await zip.file('word/numbering.xml').async('string'), /w:start w:val="3"/);
});

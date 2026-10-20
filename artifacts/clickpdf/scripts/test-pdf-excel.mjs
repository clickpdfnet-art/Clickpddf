import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
import JSZip from 'jszip';
import XLSX from 'xlsx';

const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = source => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
async function load(filename, dependencies = {}) {
  const url = new URL(`../src/utils/${filename}`, import.meta.url);
  const source = compile(await readFile(url, 'utf8')).replace(/from ['"]([^'"]+)['"]/g, (_, name) =>
    `from '${dependencies[name] || import.meta.resolve(name)}'`);
  return moduleUrl(source);
}
const valuesUrl = await load('pdfExcelValues.ts');
const tablesUrl = await load('pdfExcelTables.ts', { './pdfExcelValues': valuesUrl });
const workbookUrl = await load('pdfExcelWorkbook.ts');
const { excelValue } = await import(valuesUrl);
const { groupExcelLines, findExcelTables, combineExcelTables, tableToPreview, allTextToPreview } = await import(tablesUrl);
const { buildPdfExcelWorkbook, uniqueExcelSheetName } = await import(workbookUrl);
const frag = (text, x, y, extra = {}) => ({
  text, x, y, width: Math.max(12, text.length * 6), height: 12, size: 12,
  bold: false, italic: false, rtl: false, page: 1, ...extra
});
const page = (number, fragments, extra = {}) => ({
  number, width: 612, height: 792,
  lines: groupExcelLines(fragments.map(fragment => ({ ...fragment, page: number }))),
  ruled: true, scanned: false, issues: [], ...extra
});
const sales1 = page(1, [
  frag('Monthly Sales', 50, 35, { bold: true, size: 20, height: 20 }),
  frag('Item', 50, 100, { bold: true }), frag('Category', 180, 100, { bold: true }), frag('Amount', 320, 100, { bold: true }),
  frag('Chair', 50, 125), frag('$1,234.50', 320, 125),
  frag('Desk', 50, 150), frag('Furniture', 180, 150), frag('(€20.00)', 320, 150)
]);
const sales2 = page(2, [
  frag('Item', 50, 30, { bold: true }), frag('Category', 180, 30, { bold: true }), frag('Amount', 320, 30, { bold: true }),
  frag('Lamp', 50, 55), frag('Lighting', 180, 55), frag('12.5%', 320, 55),
  frag('Shelf', 50, 80), frag('Furniture', 180, 80), frag('2026-10-20', 320, 80)
]);

test('financial values, identifiers and ambiguous dates stay accurate and safe', () => {
  const issues = new Set();
  assert.equal(excelValue('$1,234.50', 'auto').value, 1234.5);
  assert.equal(excelValue('(€20.00)', 'auto').value, -20);
  assert.equal(excelValue('-$20.00', 'auto').value, -20);
  assert.equal(excelValue('12.5%', 'auto').value, .125);
  assert.match(excelValue('12.5%', 'auto').format, /%/);
  assert.equal(excelValue('1.234,50', 'auto').value, 1234.5);
  assert.equal(excelValue('000123', 'auto').kind, 'text');
  assert.equal(excelValue('1234567890123456', 'auto').kind, 'text');
  assert.equal(excelValue('03/04/2026', 'auto', issues).kind, 'text');
  assert.ok(issues.size);
  assert.equal(excelValue('31/12/2026', 'auto').kind, 'date');
  assert.equal(excelValue('2026-02-30', 'auto').kind, 'text');
  assert.equal(excelValue('=SUM(A1:A2)', 'auto').kind, 'text');
});

test('ruled tables preserve empty cells, page continuation and distinct new sections', () => {
  const combined = combineExcelTables([sales1, sales2], true);
  assert.equal(findExcelTables(sales1).length, 1);
  assert.equal(combined.length, 1);
  assert.deepEqual(combined[0].pages, [1, 2]);
  const preview = tableToPreview(combined[0], 'sales.pdf', 'Table 1', [sales1, sales2], 'auto');
  assert.equal(preview.rows.length, 5); // Repeated header on page 2 removed.
  assert.equal(preview.rows[1][1].value, '');
  assert.equal(preview.rows[1][2].value, 1234.5);
  assert.equal(preview.rows[3][2].value, .125);
  assert.equal(preview.rows[4][2].kind, 'date');
  assert.equal(combineExcelTables([sales1, sales2], false).length, 2);
  const distinct = page(3, [
    frag('Expense Report', 50, 205, { bold: true }),
    frag('Name', 50, 240), frag('Cost', 300, 240),
    frag('Paper', 50, 266), frag('$4.25', 300, 266),
    frag('Ink', 50, 292), frag('$10.00', 300, 292)
  ]);
  assert.equal(findExcelTables(distinct).length, 1);
  const onSamePage = page(4, [
    ...sales1.lines.flatMap(line => line.fragments).map(item => ({ ...item, y: item.y + 5 })),
    ...distinct.lines.flatMap(line => line.fragments)
  ]);
  assert.equal(findExcelTables(onSamePage).length, 2);
});

test('parallel prose columns are not mistaken for an unruled data table', () => {
  const columns = page(1, [
    frag('Left paragraph starts here', 40, 50), frag('Right paragraph starts here', 330, 50),
    frag('Left paragraph continues', 40, 70), frag('Right paragraph continues', 330, 70),
    frag('Left paragraph finishes', 40, 90), frag('Right paragraph finishes', 330, 90)
  ], { ruled: false });
  assert.equal(findExcelTables(columns).length, 0);
  const text = allTextToPreview([columns], 'prose.pdf');
  assert.equal(text.rows.length, 4);
  assert.deepEqual(text.rows[1].slice(0, 2).map(cell => cell.value), [1, 1]);
});

test('OCR table reconstruction tolerates scanned row padding and reports OCR uncertainty', () => {
  const words = [
    ['ITEM', 'PRICE', 'QTY'], ['CHAIR', '$12.50', '2'],
    ['DESK', '$100.00', '1'], ['LAMP', '$40.00', '3']
  ].flatMap((row, r) => row.map((value, c) => frag(value, [34, 268, 489][c], 142 + r * 44, { height: 13, size: 12 })));
  const source = page(1, words, { ruled: false, scanned: true, confidence: 94 });
  const table = findExcelTables(source)[0];
  assert.ok(table);
  const preview = tableToPreview(table, 'scan.pdf', 'Table 1', [source], 'auto');
  assert.equal(preview.rows.length, 4);
  assert.equal(preview.rows[1][1].value, 12.5);
  assert.equal(preview.rows[3][2].value, 3);
  assert.ok(preview.issues.some(issue => /ocr/i.test(issue)));
});

test('genuine XLSX reopens with editable numeric/date cells, sheet styles and no formulas', async () => {
  const preview = tableToPreview(combineExcelTables([sales1, sales2], true)[0], 'sales.pdf', 'Table 1', [sales1, sales2], 'auto');
  preview.rows.push([{ text: '=1+2', value: '=1+2', kind: 'text', bold: false, italic: false, rtl: false }]);
  const result = await buildPdfExcelWorkbook([preview], 'sales.pdf', 2, [], []);
  const zip = await JSZip.loadAsync(result.data);
  const styles = await zip.file('xl/styles.xml').async('string');
  assert.match(styles, /<b\/>/);
  const sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  assert.match(sheetXml, /<c r="C2" s="\d+"><v>1234.5<\/v><\/c>/);
  const reopened = XLSX.read(result.data, { type: 'array', cellDates: true, cellStyles: true });
  assert.equal(reopened.Sheets['Table 1'].C2.v, 1234.5);
  assert.equal(reopened.Sheets['Table 1'].C3.v, -20);
  assert.equal(reopened.Sheets['Table 1'].C4.v, .125);
  assert.equal(reopened.Sheets['Table 1'].C5.t, 'd');
  assert.equal(reopened.Sheets['Table 1'].A6.t, 's');
  assert.equal(reopened.Sheets['Table 1'].A6.v, '=1+2');
  assert.equal(reopened.Sheets['Table 1'].A6.f, undefined);
  assert.equal(result.sheets.length, 1);
});

test('RTL cells, distinct workbook sheet names, and no-data failure are explicit', async () => {
  const source = page(1, [
    frag('نام', 310, 50, { rtl: true, bold: true }), frag('قیمت', 60, 50, { rtl: true, bold: true }),
    frag('کرسی', 310, 77, { rtl: true }), frag('۱۲۵', 60, 77, { rtl: true }),
    frag('میز', 310, 104, { rtl: true }), frag('۶۰', 60, 104, { rtl: true })
  ]);
  const table = findExcelTables(source)[0];
  assert.ok(table);
  const preview = tableToPreview(table, 'urdu.pdf', 'Table 1', [source], 'auto');
  assert.equal(preview.rows[0][0].text, 'نام');
  const result = await buildPdfExcelWorkbook([preview], 'urdu.pdf', 1, [], preview.issues);
  const zip = await JSZip.loadAsync(result.data);
  const xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  assert.match(xml, /rightToLeft="1"/);
  assert.match(await zip.file('xl/styles.xml').async('string'), /readingOrder="2"/);
  const names = new Set();
  assert.equal(uniqueExcelSheetName('Sales', names), 'Sales');
  assert.equal(uniqueExcelSheetName('sales', names), 'sales 2');
  await assert.rejects(() => buildPdfExcelWorkbook([allTextToPreview([page(1, [], { ruled: false })], 'blank.pdf')], 'blank.pdf', 1, [], []), /No editable spreadsheet data/);
});

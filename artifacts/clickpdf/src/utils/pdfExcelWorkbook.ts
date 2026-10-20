import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { ExcelSheetPreview, PdfExcelResult } from './pdfExcelTypes';

export function uniqueExcelSheetName(wanted: string, existing: Set<string>) {
  const stem = wanted.replace(/[\\\/:\*\?\[\]\x00-\x1f]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Table';
  let name = stem, suffix = 2;
  while (existing.has(name.toLowerCase())) {
    const end = ` ${suffix++}`;
    name = `${stem.slice(0, 31 - end.length)}${end}`;
  }
  existing.add(name.toLowerCase());
  return name;
}

/** SheetJS community edition does not write font and alignment styles; add valid OOXML styles only to our own generated XLSX. */
async function applyExcelCellStyles(data: Uint8Array, sheets: ExcelSheetPreview[]): Promise<Uint8Array> {
  if (!sheets.some(sheet => sheet.type === 'text' || sheet.rows.some(row => row.some(cell => cell.bold || cell.italic || cell.rtl)) || sheet.rtl ||
    sheet.rows[0]?.length >= 2 && sheet.rows[0].every(cell => cell.kind === 'text' && cell.text.trim()) &&
      sheet.rows.slice(1).some(row => row.some(cell => cell.kind === 'number' || cell.kind === 'date')))) return data;
  const zip = await JSZip.loadAsync(data);
  let styles = await zip.file('xl/styles.xml')?.async('string');
  if (!styles) throw new Error('Excel workbook does not contain an OOXML style part.');
  const fontMatch = styles.match(/<fonts count="(\d+)">([\s\S]*?)<\/fonts>/);
  const xfMatch = styles.match(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/);
  if (!fontMatch || !xfMatch) throw new Error('Excel workbook styles could not be validated.');
  const oldFontCount = Number(fontMatch[1]), oldXfCount = Number(xfMatch[1]);
  const fonts = [
    '<font><sz val="11"/><name val="Calibri"/><b/></font>',
    '<font><sz val="11"/><name val="Calibri"/><i/></font>',
    '<font><sz val="11"/><name val="Calibri"/><b/><i/></font>',
    '<font><sz val="11"/><name val="Arial"/></font>',
    '<font><sz val="11"/><name val="Arial"/><b/></font>',
    '<font><sz val="11"/><name val="Arial"/><i/></font>',
    '<font><sz val="11"/><name val="Arial"/><b/><i/></font>'
  ];
  styles = styles.replace(fontMatch[0], `<fonts count="${oldFontCount + fonts.length}">${fontMatch[2]}${fonts.join('')}</fonts>`);
  const baseXfs = xfMatch[2].match(/<xf\b[^>]*\/>/g) || [];
  if (baseXfs.length !== oldXfCount) throw new Error('Unsupported workbook cell styles. Could not preserve original number and date formats.');
  const variants = new Map<string, number>();
  const extraXfs: string[] = [];
  for (const [sheetIndex, sheet] of sheets.entries()) {
    const filename = `xl/worksheets/sheet${sheetIndex + 1}.xml`;
    const entry = zip.file(filename);
    if (!entry) throw new Error(`Excel sheet ${sheetIndex + 1} was not written.`);
    let xml = await entry.async('string');
    const styled = new Map<string, { bold: boolean; italic: boolean; rtl: boolean }>();
    const header = sheet.type === 'text' || sheet.rows[0]?.length >= 2 &&
      sheet.rows[0].every(cell => cell.kind === 'text' && cell.text.trim()) &&
      sheet.rows.slice(1).some(row => row.some(cell => cell.kind === 'number' || cell.kind === 'date'));
    for (const [rowIndex, row] of sheet.rows.entries()) for (const [columnIndex, cell] of row.entries()) {
      if (!cell.text) continue;
      const column = XLSX.utils.encode_col(columnIndex);
      styled.set(`${column}${rowIndex + 1}`, { bold: cell.bold || !!header && rowIndex === 0,
        italic: cell.italic, rtl: cell.rtl });
    }
    xml = xml.replace(/<c\b[^>]*>/g, tag => {
      const ref = tag.match(/\br="([^"]+)"/)?.[1];
      const meta = ref && styled.get(ref);
      if (!meta || !meta.bold && !meta.italic && !meta.rtl) return tag;
      const base = Number(tag.match(/\bs="(\d+)"/)?.[1] || 0);
      if (!baseXfs[base]) throw new Error(`Cell ${ref} has an unknown number format.`);
      const key = `${base}:${Number(meta.bold)}${Number(meta.italic)}${Number(meta.rtl)}`;
      if (!variants.has(key)) {
        const fontId = meta.rtl ? oldFontCount + 3 + Number(meta.bold) + 2 * Number(meta.italic)
          : meta.bold && meta.italic ? oldFontCount + 2 : meta.bold ? oldFontCount : meta.italic ? oldFontCount + 1 : 0;
        const attrs = baseXfs[base].slice(3, -2).replace(/\sfontId="[^"]*"/, '').replace(/\sapplyFont="[^"]*"/, '');
        const xf = meta.rtl
          ? `<xf${attrs} fontId="${fontId}" applyFont="1" applyAlignment="1"><alignment horizontal="right" readingOrder="2"/></xf>`
          : `<xf${attrs} fontId="${fontId}" applyFont="1"/>`;
        variants.set(key, oldXfCount + extraXfs.length);
        extraXfs.push(xf);
      }
      return /\bs="\d+"/.test(tag) ? tag.replace(/\bs="\d+"/, `s="${variants.get(key)}"`)
        : tag.replace(/>$/, ` s="${variants.get(key)}">`);
    });
    if (sheet.rtl) xml = xml.replace(/<sheetView\b([^>]*?)(\/?)>/,
      (_, attrs: string, closing: string) => `<sheetView${attrs} rightToLeft="1"${closing}>`);
    zip.file(filename, xml);
  }
  styles = styles.replace(xfMatch[0], `<cellXfs count="${oldXfCount + extraXfs.length}">${xfMatch[2]}${extraXfs.join('')}</cellXfs>`);
  zip.file('xl/styles.xml', styles);
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}

export async function buildPdfExcelWorkbook(sheets: ExcelSheetPreview[], name: string, pageCount: number, scannedPages: number[], issues: string[]): Promise<PdfExcelResult> {
  if (!sheets.length || !sheets.some(sheet => (sheet.type === 'text' ? sheet.rows.slice(1) : sheet.rows)
    .some(row => row.some(cell => cell.text)))) {
    throw new Error('No editable spreadsheet data was detected. Try Extract All Text, or OCR for a scanned document.');
  }
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows.map(row => row.map(cell => cell.value)), { cellDates: true });
    for (const [r, row] of sheet.rows.entries()) for (const [c, cell] of row.entries()) {
      const excel = ws[XLSX.utils.encode_cell({ r, c })];
      if (!excel) continue;
      if (cell.format) excel.z = cell.format;
      if (cell.kind === 'date') { excel.t = 'd'; excel.v = cell.value; }
    }
    ws['!cols'] = Array.from({ length: sheet.rows.reduce((maximum, row) => Math.max(maximum, row.length), 0) }, (_, col) => ({
      wch: Math.min(65, Math.max(11, ...sheet.rows.slice(0, 150).map(row => Math.min(65, row[col]?.text.length || 0) + 2)))
    }));
    XLSX.utils.book_append_sheet(workbook, ws, sheet.name);
  }
  let data = new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx', cellDates: true, cellStyles: true }));
  data = await applyExcelCellStyles(data, sheets);
  // Validate the actual serialized workbook, not a pre-export in-memory model.
  const verified = XLSX.read(data, { type: 'array', cellDates: true, cellStyles: true });
  if (verified.SheetNames.length !== sheets.length || sheets.some((sheet, index) =>
    verified.SheetNames[index] !== sheet.name || !verified.Sheets[sheet.name] ||
    sheet.rows.some((row, rowIndex) => row.some((cell, columnIndex) =>
      cell.text && !verified.Sheets[sheet.name][XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })])))) {
    throw new Error('Generated Excel workbook failed its export validation.');
  }
  return { data, fileName: `${name.replace(/\.pdf$/i, '')}.xlsx`, sheets, issues, pageCount, scannedPages };
}

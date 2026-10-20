import { excelCell, excelValue, emptyExcelCell } from './pdfExcelValues';
import type { ExcelCell, ExcelFragment, ExcelLine, ExcelPage, ExcelSheetPreview, ExcelTable, PdfExcelLocale } from './pdfExcelTypes';

export function groupExcelLines(fragments: ExcelFragment[]): ExcelLine[] {
  const buckets: ExcelFragment[][] = [];
  for (const item of [...fragments].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const found = buckets.find(bucket => Math.abs(bucket[0].y - item.y) <= Math.max(3, Math.min(bucket[0].height, item.height) * .4));
    if (found) found.push(item); else buckets.push([item]);
  }
  return buckets.map(row => {
    row.sort((a, b) => a.x - b.x);
    const cells: ExcelLine['cells'] = [];
    for (const item of row) {
      const current = cells.at(-1);
      const last = current?.fragments.at(-1);
      const gap = last ? item.x - last.x - last.width : Infinity;
      if (!current || gap > Math.max(18, item.size * 2)) {
        cells.push({ x: item.x, right: item.x + item.width, fragments: [item], text: item.text });
      } else {
        if (gap > 1 && !/\s$/.test(current.text) && !/^\s/.test(item.text)) current.text += ' ';
        current.text += item.text;
        current.fragments.push(item); current.right = Math.max(current.right, item.x + item.width);
      }
    }
    return { fragments: row, cells, y: Math.min(...row.map(item => item.y)), height: Math.max(...row.map(item => item.height)) };
  }).sort((a, b) => a.y - b.y);
}

function isSectionHeader(line: ExcelLine, median: number) {
  const cell = line.cells[0];
  return line.cells.length === 1 && cell &&
    (line.height > median * 1.3 || cell.fragments.some(item => item.bold)) &&
    cell.text.trim().length <= 90;
}
function titleBefore(lines: ExcelLine[], start: number) {
  if (start < 1) return undefined;
  const preceding = lines[start - 1];
  if (preceding.cells.length !== 1 || preceding.cells[0].text.length > 70) return undefined;
  return preceding.cells[0].text.trim() || undefined;
}

/** Geometry-based recognition: require stable multi-column rows, not arbitrary paragraphs. */
export function findExcelTables(page: ExcelPage): ExcelTable[] {
  const lines = page.lines, tables: ExcelTable[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].cells.length < 2) continue;
    const start = i, rows = [lines[i]];
    const medianHeight = lines[i].height;
    while (i + 1 < lines.length) {
      const next = lines[i + 1], previous = lines[i];
      if (next.y - previous.y > Math.max(page.ruled ? 72 : 48, previous.height * 3.6) || isSectionHeader(next, medianHeight)) break;
      if (next.cells.length > 1 && Math.abs(next.cells[0].x - rows[0].cells[0].x) > 24) break;
      rows.push(next); i++;
    }
    const multi = rows.filter(row => row.cells.length >= 2);
    const columns = rows.reduce((maximum, row) => Math.max(maximum, row.cells.length), 0);
    // Two-row candidates require PDF rulings; unruled OCR/text needs 3 aligned rows.
    if (multi.length < (page.ruled ? 2 : 3) || columns < 2) continue;
    if (!page.ruled && !multi.slice(1).some(row => row.cells.some(cell => excelValue(cell.text, 'auto').kind !== 'text')) &&
      !multi[0].cells.some(cell => cell.fragments.some(fragment => fragment.bold))) {
      i = start; // A pair of plain text columns is not sufficient evidence of a table.
      continue;
    }
    const seed = [...multi].sort((a, b) => b.cells.length - a.cells.length)[0];
    const starts = seed.cells.map(cell => cell.x);
    if (multi.some(row => row.cells.some(cell => {
      const midpoint = (cell.x + cell.right) / 2;
      return Math.min(...seed.cells.map(reference => Math.abs(midpoint - (reference.x + reference.right) / 2))) > Math.max(36, page.width / (columns * 2.7));
    }))) { i = start; continue; }
    tables.push({ pages: [page.number], sourceRows: rows, columnX: starts, title: titleBefore(lines, start),
      ruled: page.ruled, ocr: page.scanned, issues: [
        ...(!page.ruled ? ['This table was inferred from aligned text, not PDF grid borders; review its columns.'] : []),
        ...(page.scanned ? [`Scanned table reconstructed heuristically from OCR${page.confidence !== undefined ? ` (${page.confidence}% confidence)` : ''}; empty cells, merged cells and columns may be inaccurate.`] : [])
      ] });
  }
  return tables;
}

export function combineExcelTables(pages: ExcelPage[], enabled: boolean): ExcelTable[] {
  const ordered = pages.flatMap(findExcelTables), combined: ExcelTable[] = [];
  for (const table of ordered) {
    const last = combined.at(-1);
    const firstRow = table.sourceRows[0].cells.map(cell => cell.text.trim().toLocaleLowerCase());
    const formerHeader = last?.sourceRows[0].cells.map(cell => cell.text.trim().toLocaleLowerCase());
    const sameHeading = firstRow.length > 1 && firstRow.every((text, index) => text && formerHeader?.[index] === text) &&
      firstRow.some(text => /[a-z\u0600-\u06ff\u3040-\u9fff]/iu.test(text));
    const sameColumns = last?.columnX.length === table.columnX.length && table.columnX.every((x, index) => {
      const former = pages.find(page => page.number === last?.pages[0]);
      const current = pages.find(page => page.number === table.pages[0]);
      return former && current && Math.abs(x / current.width - last!.columnX[index] / former.width) < .035;
    });
    if (enabled && last?.pages.at(-1) === table.pages[0] - 1 && sameHeading && sameColumns &&
      (!last.title || !table.title || last.title.toLocaleLowerCase() === table.title.toLocaleLowerCase())) {
      last.sourceRows.push(...table.sourceRows.slice(1)); last.pages.push(...table.pages);
      last.issues.push(`Pages ${last.pages.join(', ')} were joined using matching headings and column positions. Repeated headers were omitted.`);
    } else combined.push({ ...table, sourceRows: [...table.sourceRows], pages: [...table.pages], issues: [...table.issues] });
  }
  return combined;
}

function assignColumns(line: ExcelLine, starts: number[], pageWidth: number, locale: PdfExcelLocale, issues: Set<string>) {
  const row: ExcelCell[][] = Array.from({ length: starts.length }, () => []);
  const boundaries = starts.slice(1).map((x, index) => (x + starts[index]) / 2);
  for (const segment of line.cells) {
    const center = (segment.x + segment.right) / 2;
    let index = boundaries.findIndex(boundary => center < boundary);
    if (index < 0) index = starts.length - 1;
    // A long label can span the midpoint; prefer its left edge when it starts at the known column.
    const aligned = starts.findIndex(start => Math.abs(start - segment.x) < Math.max(12, pageWidth * .02));
    if (aligned >= 0) index = aligned;
    row[index].push(excelCell(segment.fragments, locale, issues));
  }
  return row.map(values => values.length ? {
    ...values[0], ...(values.length > 1 ? {
      text: values.map(cell => cell.text).join(' · '), value: values.map(cell => cell.text).join(' · '),
      kind: 'text' as const
    } : {})
  } : emptyExcelCell());
}

export function tableToPreview(table: ExcelTable, fileName: string, name: string, pages: ExcelPage[], locale: PdfExcelLocale): ExcelSheetPreview {
  const issues = new Set(table.issues);
  const source = pages.find(page => page.number === table.pages[0])!;
  const fragments = table.sourceRows.flatMap(row => row.fragments);
  const rtl = fragments.filter(fragment => fragment.rtl).length > fragments.length / 2;
  const rows = table.sourceRows.map(line => {
    const cells = assignColumns(line, table.columnX, source.width, locale, issues);
    return rtl ? cells.reverse() : cells;
  });
  if (rows.some(row => row.some(cell => cell.text.includes(' · ')))) issues.add('Multiple fragments fell into one inferred column; review any values joined with a middle dot.');
  return { name, sourceFile: fileName, type: 'table', pages: table.pages, rows, issues: [...issues], rtl };
}

export function allTextToPreview(pages: ExcelPage[], fileName: string, name = 'All Text', locale: PdfExcelLocale = 'auto'): ExcelSheetPreview {
  const issues = new Set(pages.flatMap(page => page.issues));
  const rows: ExcelCell[][] = [['Page', 'Line', 'Extracted text'].map(text =>
    ({ ...emptyExcelCell(), text, value: text, bold: true }))];
  for (const page of pages) for (const [index, line] of page.lines.entries()) {
    const ordered = line.fragments.filter(fragment => fragment.rtl).length > line.fragments.length / 2
      ? [...line.fragments].reverse() : line.fragments;
    const raw = ordered.map(fragment => fragment.text).join(' ').trim();
    if (!raw) continue;
    rows.push([
      { ...emptyExcelCell(), text: String(page.number), value: page.number, kind: 'number', format: '0' },
      { ...emptyExcelCell(), text: String(index + 1), value: index + 1, kind: 'number', format: '0' },
      { ...excelCell(line.fragments, locale, issues), text: raw, value: raw, kind: 'text' }
    ]);
  }
  return { name, type: 'text', sourceFile: fileName, pages: pages.map(page => page.number), rows, issues: [...issues] };
}

import type { WordLine, WordSpan } from './pdfWordTypes';
export const isRtlText = (text: string) => /[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff]/u.test(text);
export const twips = (points: number) => Math.round(points * 20);
export const emus = (points: number) => Math.round(points * 12700);

export function groupWordLines(spans: WordSpan[]): WordLine[] {
  const rows: WordSpan[][] = [];
  for (const span of [...spans].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(items => Math.abs(items[0].y - span.y) < Math.max(2, Math.min(items[0].height, span.height) * .4));
    if (row) row.push(span); else rows.push([span]);
  }
  return rows.map(items => {
    const rtl = items.filter(item => item.rtl).length > items.length / 2;
    items.sort((a, b) => rtl ? b.x - a.x : a.x - b.x);
    const x = Math.min(...items.map(item => item.x)), y = Math.min(...items.map(item => item.y));
    return { spans: items, x, y, width: Math.max(...items.map(item => item.x + item.width)) - x,
      height: Math.max(...items.map(item => item.height)), rtl };
  }).sort((a, b) => a.y - b.y);
}

/** Split only clear horizontal gaps; tables additionally require detected PDF rulings. */
export function lineCells(line: WordLine): WordSpan[][] {
  const spans = [...line.spans].sort((a, b) => a.x - b.x);
  const cells: WordSpan[][] = [];
  for (const span of spans) {
    const previous = cells.at(-1)?.at(-1);
    if (!previous || span.x - previous.x - previous.width > Math.max(16, span.size * 2)) cells.push([span]);
    else cells.at(-1)!.push(span);
  }
  return cells;
}

export function findRuledTables(lines: WordLine[], ruled: boolean): { start: number; end: number; cells: WordSpan[][][] }[] {
  if (!ruled) return [];
  const tables: ReturnType<typeof findRuledTables> = [];
  for (let index = 0; index < lines.length; index++) {
    const first = lineCells(lines[index]);
    if (first.length < 2) continue;
    const rows = [first];
    let end = index;
    while (end + 1 < lines.length) {
      const next = lineCells(lines[end + 1]);
      if (next.length !== first.length || lines[end + 1].y - lines[end].y > Math.max(50, lines[end].height * 3) ||
        next.some((cell, column) => Math.abs(cell[0].x - first[column][0].x) > 8)) break;
      rows.push(next); end++;
    }
    // A pair of short aligned rows plus explicit rulings is conservative enough for simple tables.
    if (rows.length >= 2 && rows.every(row => row.every(cell => cell.map(span => span.text).join('').length < 200))) {
      tables.push({ start: index, end, cells: rows }); index = end;
    }
  }
  return tables;
}

export function safeWordFont(name: string, text: string): { font: string; substituted: boolean } {
  const cleaned = name.replace(/^[A-Z]{6}\+/, '').replace(/[-,](BoldItalic|BoldOblique|Bold|Italic|Oblique|Regular|Roman)$/i, '');
  if (isRtlText(text)) return { font: 'Arial', substituted: true };
  if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(text)) return { font: 'Yu Mincho', substituted: true };
  if (/helvetica|arial|sans-serif/i.test(cleaned)) return { font: 'Arial', substituted: !/arial/i.test(cleaned) };
  if (/times|serif/i.test(cleaned)) return { font: 'Times New Roman', substituted: !/Times New Roman/i.test(cleaned) };
  if (/courier|monospace/i.test(cleaned)) return { font: 'Courier New', substituted: !/Courier New/i.test(cleaned) };
  return { font: cleaned && !/^g_|^f\d|^sans$/i.test(cleaned) ? cleaned : 'Arial', substituted: true };
}

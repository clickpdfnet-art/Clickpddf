/** Tool-local, conservative layout conversion; never invent text or table structure. */
export interface ExtractedTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  dir?: string;
}

export interface TextLine {
  text: string;
  size: number;
  y: number;
}

export function textItemsToLines(items: ExtractedTextItem[]): TextLine[] {
  const rows: { y: number; size: number; items: ExtractedTextItem[] }[] = [];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const size = Math.hypot(item.transform[2], item.transform[3]) || item.height || 12;
    const y = item.transform[5];
    let row = rows.find(candidate => Math.abs(candidate.y - y) <= Math.max(2, Math.min(candidate.size, size) * 0.3));
    if (!row) {
      row = { y, size, items: [] };
      rows.push(row);
    }
    row.items.push(item);
    row.size = Math.max(row.size, size);
  }
  return rows.sort((a, b) => b.y - a.y).map(row => {
    const rtl = row.items.filter(item => item.dir === 'rtl').length > row.items.length / 2;
    row.items.sort((a, b) => rtl ? b.transform[4] - a.transform[4] : a.transform[4] - b.transform[4]);
    let text = '';
    let previous: ExtractedTextItem | undefined;
    for (const item of row.items) {
      const gap = previous && !rtl ? item.transform[4] - (previous.transform[4] + previous.width) : row.size;
      const needsSpace = text && !/\s$/.test(text) && !/^\s/.test(item.str) && gap! > row.size * 0.12;
      text += `${needsSpace ? ' ' : ''}${item.str}`;
      previous = item;
    }
    return { text: text.trim(), size: row.size, y: row.y };
  });
}

export function linesToTextAndMarkdown(lines: TextLine[]): { text: string; markdown: string } {
  if (!lines.length) return { text: '', markdown: '' };
  // Weight by character count so a short, large title doesn't become the body size.
  const sizes = lines.flatMap(line => Array(Math.min(line.text.length, 150)).fill(line.size) as number[]).sort((a, b) => a - b);
  const bodySize = sizes[Math.floor(sizes.length / 2)] || 12;
  const text: string[] = [];
  const markdown: string[] = [];
  let previous: TextLine | undefined;
  for (const line of lines) {
    const paragraphGap = previous && Math.abs(previous.y - line.y) > Math.max(previous.size, line.size) * 1.8;
    if (paragraphGap) { text.push(''); markdown.push(''); }
    text.push(line.text);
    const escaped = line.text.replace(/([\\`*_{}[\]<>])/g, '\\$1');
    if (line.size >= bodySize * 1.25 && line.text.length < 180) {
      const level = line.size >= bodySize * 1.8 ? '#' : '##';
      markdown.push(`${level} ${escaped}`, '');
    } else if (/^[•●▪‣]\s*/u.test(line.text)) {
      markdown.push(`- ${escaped.replace(/^[•●▪‣]\s*/u, '')}`);
    } else {
      // Keep distinct PDF lines readable without claiming perfect semantic reconstruction.
      markdown.push(escaped);
    }
    previous = line;
  }
  return { text: text.join('\n').trim(), markdown: markdown.join('\n').trim() };
}

export function uniqueTextOutputNames(fileNames: string[]): string[] {
  const used = new Set<string>();
  return fileNames.map(fileName => {
    const stem = fileName.replace(/\.pdf$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'document';
    let name = stem;
    let counter = 2;
    while (used.has(name.toLowerCase())) name = `${stem}_${counter++}`;
    used.add(name.toLowerCase());
    return name;
  });
}

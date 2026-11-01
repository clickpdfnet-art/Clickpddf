function splitPages(text, expectedPages) {
  const pages = String(text).split('\f').map((page) => page.trim());
  while (pages.length < expectedPages) pages.push('');
  return pages.slice(0, expectedPages);
}

function normalizeForComparison(text) {
  return String(text).normalize('NFC').replace(/\s+/g, ' ').trim();
}

export function buildPdfTextComparisonReport(original, revised) {
  const originalPages = splitPages(original.text, original.pages);
  const revisedPages = splitPages(revised.text, revised.pages);
  const pageCount = Math.max(originalPages.length, revisedPages.length);
  const output = [
    'ClickPDF — Selectable PDF Text Comparison',
    `Original: ${original.fileName}`,
    `Revised: ${revised.fileName}`,
    `Pages: ${original.pages} original; ${revised.pages} revised`,
    '',
    'Scope: compares extracted selectable text page by page. It does not compare images, visual layout, formatting, handwriting, or scanned pages without OCR.',
    '',
  ];

  for (let index = 0; index < pageCount; index++) {
    const before = originalPages[index] ?? '';
    const after = revisedPages[index] ?? '';
    const status = index >= originalPages.length
      ? 'PAGE ADDED'
      : index >= revisedPages.length
        ? 'PAGE REMOVED'
        : normalizeForComparison(before) === normalizeForComparison(after)
          ? 'TEXT MATCH'
          : 'TEXT DIFFERS';

    output.push(`===== PAGE ${index + 1}: ${status} =====`);
    output.push('--- ORIGINAL ---');
    output.push(before || '[No selectable text on this page]');
    output.push('--- REVISED ---');
    output.push(after || '[No selectable text on this page]');
    output.push('');
  }

  const scanWarnings = [
    ...(original.emptyPages.length ? [`Original file has no selectable text on page(s): ${original.emptyPages.join(', ')}.`] : []),
    ...(revised.emptyPages.length ? [`Revised file has no selectable text on page(s): ${revised.emptyPages.join(', ')}.`] : []),
  ];
  if (scanWarnings.length) {
    output.push('OCR NOTE');
    output.push(...scanWarnings, 'Pages without selectable text may be scans or blank pages; this report does not OCR them.');
    output.push('');
  }

  return output.join('\n');
}

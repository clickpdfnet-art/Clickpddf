import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';
import { initPdfWorker } from './pdfWorkerSetup';
import { SUPPORTED_OCR_LANGUAGES } from './ocrLanguages';
import { canvasPng, renderWordPage, extractWordArtwork, remainingScanArtwork, hasVisibleScanContent } from './pdfWordGraphics';
import type { WordOperators } from './pdfWordGraphics';
import { groupWordLines, isRtlText, safeWordFont } from './pdfWordGeometry';
import type { PdfWordOptions, WordPage, WordSpan } from './pdfWordTypes';

const normalized = (text: string) => text.replace(/\s+/gu, '');
function colorHex(value: unknown): string {
  if (typeof value === 'string' && /^#?[0-9a-f]{6}$/i.test(value)) return value.replace('#', '').toUpperCase();
  return '000000';
}

/** Only the PDF-to-Word advanced engine consumes this extractor. */
export async function extractWordPages(
  file: File, options: PdfWordOptions, language: string,
  progress: (current: number, total: number, text: string) => void
): Promise<WordPage[]> {
  initPdfWorker();
  const url = URL.createObjectURL(file);
  const task = pdfjs.getDocument({ url, stopAtErrors: true });
  let worker: Tesseract.Worker | undefined;
  const pages: WordPage[] = [];
  try {
    const pdf = await task.promise;
    for (let number = 1; number <= pdf.numPages; number++) {
      progress(number, pdf.numPages, `Reading page ${number}/${pdf.numPages} — ${options.mode} mode`);
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 1 });
      const result: WordPage = { number, width: viewport.width, height: viewport.height, lines: [], artwork: [], ruled: false, ocr: false, warnings: [] };
      try {
        if (options.imageFallback === 'all') {
          const canvas = await renderWordPage(page);
          try { result.artwork.push({ data: await canvasPng(canvas), x: 0, y: 0, width: result.width, height: result.height, role: 'page-image' }); }
          finally { canvas.width = canvas.height = 0; }
          result.warnings.push('User-selected full-page image fallback: this page has no normally editable text.');
          pages.push(result); continue;
        }
        const content = await page.getTextContent();
        const items = content.items.filter(item => 'str' in item && item.str.trim());
        if (!items.length) {
          result.ocr = true;
          const scale = 2;
          const canvas = await renderWordPage(page, scale);
          try {
            if (!hasVisibleScanContent(canvas)) {
              result.ocr = false;
              result.warnings.push('Blank source page preserved as an empty Word section. OCR was not needed.');
              pages.push(result); continue;
            }
            progress(number, pdf.numPages, `OCR page ${number}/${pdf.numPages}; loading ${language} model only if needed`);
            if (!SUPPORTED_OCR_LANGUAGES.some(option => option.code === language)) throw new Error(`OCR model "${language}" is not supported.`);
            worker ??= await Tesseract.createWorker(language, undefined, { logger: message => {
              if (message.status === 'loading language traineddata') progress(number, pdf.numPages, `Downloading ${language} OCR model…`);
            } });
            const recognized = await worker.recognize(canvas, {}, { text: true, blocks: true });
            const spans: WordSpan[] = [];
            const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
            for (const block of recognized.data.blocks || []) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {
              for (const word of line.words) {
                if (!word.text.trim()) continue;
                const box = word.bbox;
                boxes.push(box);
                const font = safeWordFont('Arial', word.text).font;
                spans.push({ text: word.text, x: box.x0 / scale, y: box.y0 / scale, width: (box.x1 - box.x0) / scale,
                  height: (box.y1 - box.y0) / scale, size: Math.max(6, (box.y1 - box.y0) / scale * .85),
                  font, color: '000000', bold: false, italic: false, rtl: isRtlText(word.text) });
              }
            }
            if (!spans.length) throw new Error('No readable text was recognized on this scanned or blank page.');
            result.lines = groupWordLines(spans);
            // Keep scan artwork without painting the recognized words a second time.
            const context = canvas.getContext('2d')!;
            for (const box of boxes) {
              const sample = context.getImageData(Math.max(0, box.x0 - 2), Math.max(0, box.y0 - 2), 1, 1).data;
              context.fillStyle = `rgb(${sample[0]},${sample[1]},${sample[2]})`;
              context.fillRect(Math.max(0, box.x0 - 1), Math.max(0, box.y0 - 1), box.x1 - box.x0 + 2, box.y1 - box.y0 + 2);
            }
            const artwork = await remainingScanArtwork(canvas, scale);
            if (artwork) result.artwork.push(artwork);
            result.warnings.push(`OCR confidence ${Math.round(recognized.data.confidence)}%. Verify recognized text; original fonts, colors and fine artwork cannot be recovered reliably from a scan.`);
            if (artwork) result.warnings.push('Scanned artwork uses approximate text masking to avoid duplicate visible words; borders or backgrounds near text may differ.');
          } catch (error: any) {
            if (options.imageFallback !== 'unrecognized') throw new Error(`Page ${number}: OCR failed or its language model was unavailable. ${error?.message || error}`);
            result.lines = [];
            const fallback = await renderWordPage(page);
            try { result.artwork = [{ data: await canvasPng(fallback), x: 0, y: 0, width: result.width, height: result.height, role: 'page-image' }]; }
            finally { fallback.width = fallback.height = 0; }
            result.warnings.push(`Page-image fallback used because OCR failed: ${error?.message || error}. This page is not normally editable.`);
          } finally { canvas.width = canvas.height = 0; }
        } else {
          const operators: WordOperators = await page.getOperatorList();
          let fill = '000000', fontId = '';
          const stack: { fill: string; font: string }[] = [];
          const paints: { text: string; color: string; font: string }[] = [];
          for (let index = 0; index < operators.fnArray.length; index++) {
            const op = operators.fnArray[index], args = operators.argsArray[index];
            if (op === pdfjs.OPS.save) stack.push({ fill, font: fontId });
            else if (op === pdfjs.OPS.restore) { const prior = stack.pop(); if (prior) { fill = prior.fill; fontId = prior.font; } }
            else if (op === pdfjs.OPS.setFillRGBColor) fill = colorHex(args?.[0]);
            else if (op === pdfjs.OPS.setFont) fontId = args[0];
            else if (op === pdfjs.OPS.showText || op === pdfjs.OPS.showSpacedText) {
              const text = (args?.[0] || []).filter((glyph: any) => glyph && typeof glyph === 'object').map((glyph: any) => glyph.unicode || '').join('');
              if (text) paints.push({ text: normalized(text), color: fill, font: fontId });
            }
          }
          const annotations = await page.getAnnotations();
          if (annotations.some(annotation => annotation.subtype !== 'Link')) result.warnings.push('Interactive form fields, comments and annotations are not reconstructed as interactive Word objects.');
          const links = annotations.filter(annotation => annotation.subtype === 'Link' && typeof annotation.url === 'string' && /^(https?:|mailto:)/i.test(annotation.url))
            .map(annotation => {
              const matrix = viewport.transform;
              const rect = annotation.rect as number[];
              const point = (x: number, y: number) => [matrix[0] * x + matrix[2] * y + matrix[4], matrix[1] * x + matrix[3] * y + matrix[5]];
              return { rect: [...point(rect[0], rect[1]), ...point(rect[2], rect[3])], url: annotation.url as string };
            });
          let paintCursor = 0, unmatchedColors = 0;
          const fonts = new Set<string>();
          const spans: WordSpan[] = [];
          for (const item of items) {
            if (!('str' in item)) continue;
            const transform = pdfjs.Util.transform(viewport.transform, item.transform);
            const size = Math.hypot(transform[2], transform[3]) || item.height || 12;
            const style = content.styles[item.fontName];
            let originalFont = style?.fontFamily || 'Arial';
            try {
              if (page.commonObjs.has(item.fontName)) {
                const object = page.commonObjs.get(item.fontName);
                originalFont = object?.name || object?.fontFamily || originalFont;
              }
            } catch { /* A font family from getTextContent remains a valid fallback. */ }
            const font = safeWordFont(originalFont, item.str);
            if (font.substituted) fonts.add(`${originalFont} → ${font.font}`);
            const wanted = normalized(item.str);
            const matched = paints.findIndex((paint, index) => index >= paintCursor && paint.font === item.fontName &&
              (paint.text.includes(wanted) || wanted.includes(paint.text)));
            if (matched >= 0) paintCursor = matched;
            else unmatchedColors++;
            const x = transform[4], y = transform[5] - size * (style?.ascent ?? .85);
            const width = item.width, height = Math.max(size, item.height);
            const link = links.find(candidate => {
              const [x1, y1, x2, y2] = candidate.rect;
              return x + width / 2 >= Math.min(x1, x2) && x + width / 2 <= Math.max(x1, x2) &&
                y + height / 2 >= Math.min(y1, y2) && y + height / 2 <= Math.max(y1, y2);
            });
            spans.push({ text: item.str, x, y, width, height, size, font: font.font,
              color: matched >= 0 ? paints[matched].color : '000000', bold: /bold|black|heavy|demi/i.test(originalFont),
              italic: /italic|oblique/i.test(originalFont), rtl: item.dir === 'rtl' || (!['ltr', 'rtl'].includes(item.dir) && isRtlText(item.str)), link: link?.url });
            if (Math.abs(transform[1]) > 1 || Math.abs(transform[2]) > 1) result.warnings.push('Rotated or skewed text is preserved as editable text but its rotation may differ.');
          }
          result.lines = groupWordLines(spans);
          result.ruled = operators.fnArray.filter(op => op === pdfjs.OPS.constructPath).length >= 3;
          if (fonts.size) result.warnings.push(`Font substitution (fonts are not embedded): ${[...fonts].join('; ')}.`);
          if (unmatchedColors) result.warnings.push(`${unmatchedColors} text run(s) had unresolved paint color and use black; review the source comparison.`);
          try { result.artwork = await extractWordArtwork(page, operators, result.warnings); }
          catch (error: any) { throw new Error(`Page ${number}: artwork could not be preserved reliably: ${error?.message || error}`); }
        }
        result.warnings = [...new Set(result.warnings)];
        pages.push(result);
      } finally { page.cleanup(); }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    return pages;
  } finally {
    await worker?.terminate().catch(() => {});
    await task.destroy().catch(() => {});
    URL.revokeObjectURL(url);
  }
}

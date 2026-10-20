import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type Tesseract from 'tesseract.js';
import bundledPdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { createWordOcrWorker } from './pdfWordOcrRuntime';
import { parseWordPageRange, parseWordPageModels, suggestWordLanguage, validateWordLanguages } from './pdfWordLanguages';
import { wordAbort, wordAbortable, wordRenderScale, inspectWordBrowser, validateWordBrowser } from './pdfWordRuntimeChecks';
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
  progress: (current: number, total: number, text: string) => void, signal?: AbortSignal
): Promise<WordPage[]> {
  validateWordBrowser(inspectWordBrowser(), options.enableOcr !== false && options.imageFallback !== 'all');
  wordAbort(signal);
  // PDF.js transfers this sole typed buffer to its explicitly owned worker.
  // No shared GlobalWorkerOptions, CDN worker fallback or PDF upload is used.
  const nativeWorker = new Worker(new URL(bundledPdfWorker, location.href), { type: 'module' });
  const pdfWorker = new pdfjs.PDFWorker({ port: nativeWorker });
  let task: pdfjs.PDFDocumentLoadingTask | undefined;
  let worker: Tesseract.Worker | undefined;
  let workerLanguages = '';
  const abort = () => { void task?.destroy().catch(() => {}); nativeWorker.terminate(); void worker?.terminate().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  const pages: WordPage[] = [];
  let retainedBytes = 0;
  try {
    const bytes = new Uint8Array(await wordAbortable(file.arrayBuffer(), signal));
    wordAbort(signal);
    task = pdfjs.getDocument({ data: bytes, worker: pdfWorker, stopAtErrors: true, isEvalSupported: false, enableXfa: false });
    const pdf = await wordAbortable(task.promise, signal);
    const numbers = parseWordPageRange(options.pageRange || '', pdf.numPages);
    const overrides = options.lockLanguages === false ? parseWordPageModels(options.pageModels || '', pdf.numPages) : new Map<number, string[]>();
    for (const [index, number] of numbers.entries()) {
      wordAbort(signal);
      const selectedModels = overrides.get(number) || [...new Set([language, ...(options.additionalLanguages || [])])];
      progress(index, numbers.length, `Reading source page ${number}/${pdf.numPages} — ${options.mode} mode · OCR selection ${selectedModels.join('+')}`);
      const page = await wordAbortable(pdf.getPage(number), signal);
      const viewport = page.getViewport({ scale: 1 });
      const result: WordPage = { number, width: viewport.width, height: viewport.height, lines: [], artwork: [], ruled: false, ocr: false, warnings: [] };
      try {
        if (options.imageFallback === 'all') {
          const canvas = await renderWordPage(page, 1.5, signal, options.maxRenderPixels);
          try { result.artwork.push({ data: await canvasPng(canvas), x: 0, y: 0, width: result.width, height: result.height, role: 'page-image' }); }
          finally { canvas.width = canvas.height = 0; }
          result.warnings.push('User-selected full-page image fallback: this page has no normally editable text.');
          pages.push(result); continue;
        }
        const content = await wordAbortable(page.getTextContent(), signal);
        const items = content.items.filter(item => 'str' in item && item.str.trim());
        const sample = items.map(item => 'str' in item ? item.str : '').join(' ').slice(0, 4096);
        const suggestion = suggestWordLanguage(sample);
        result.language = { selectedModels, ...suggestion };
        const badText = sample.length > 8 && (sample.match(/[\ufffd\ue000-\uf8ff]/gu)?.length || 0) / sample.length > .12;
        let sparseScan = false;
        if (sample.trim().length < 24 && items.length) {
          const operations = await wordAbortable(page.getOperatorList(), signal);
          sparseScan = operations.fnArray.some((op, i) => op === pdfjs.OPS.paintImageXObject &&
            (operations.argsArray[i]?.[1] || 0) * (operations.argsArray[i]?.[2] || 0) > viewport.width * viewport.height);
        }
        if (options.forceOcr || !items.length || badText || sparseScan) {
          result.ocr = true;
          const scale = wordRenderScale(viewport.width, viewport.height, 2, options.maxRenderPixels);
          const canvas = await renderWordPage(page, scale, signal, options.maxRenderPixels);
          try {
            if (!hasVisibleScanContent(canvas)) {
              result.ocr = false;
              result.warnings.push('Blank source page preserved as an empty Word section. OCR was not needed.');
              pages.push(result); continue;
            }
            if (options.enableOcr === false) {
              if (options.allowPartialText && !items.length) {
                result.ocr = false;
                result.warnings.push('PARTIAL OUTPUT: image-only page was not converted because OCR is disabled. This section contains a notice, not recovered source text.');
                result.lines = groupWordLines([{ text: `[Source page ${number}: scanned content not converted — OCR disabled]`,
                  x: 30, y: 30, width: result.width - 60, height: 14, size: 12, font: 'Arial', bold: false,
                  italic: false, rtl: false, color: 'AA0000' }]);
                pages.push(result); continue;
              }
              throw new Error('OCR is disabled. Select a page range containing readable text, enable OCR, or explicitly permit partial text-only output.');
            }
            validateWordLanguages(selectedModels);
            if (selectedModels.join('+') !== workerLanguages) {
              await worker?.terminate().catch(() => {});
              worker = await createWordOcrWorker(selectedModels, signal, message => progress(index, numbers.length, `Page ${number}: ${message}`));
              workerLanguages = selectedModels.join('+');
            }
            wordAbort(signal);
            progress(index, numbers.length, `Recognizing page ${number} with ${workerLanguages}…`);
            const recognized = await wordAbortable(worker!.recognize(canvas, {}, { text: true, blocks: true }), signal);
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
            result.language = { selectedModels, ...suggestWordLanguage(spans.map(span => span.text).join(' ')) };
            result.warnings.push(`OCR models: ${workerLanguages}; manually selected. Automatic scan-language detection is not configured. Combined-language accuracy is unverified.`);
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
            wordAbort(signal);
            if (options.imageFallback !== 'unrecognized') throw new Error(`Page ${number}: OCR failed or its language model was unavailable. ${error?.message || error}`);
            result.lines = [];
            const fallback = await renderWordPage(page, 1.5, signal, options.maxRenderPixels);
            try { result.artwork = [{ data: await canvasPng(fallback), x: 0, y: 0, width: result.width, height: result.height, role: 'page-image' }]; }
            finally { fallback.width = fallback.height = 0; }
            result.warnings.push(`Page-image fallback used because OCR failed: ${error?.message || error}. This page is not normally editable.`);
          } finally { canvas.width = canvas.height = 0; }
        } else {
          const operators: WordOperators = await wordAbortable(page.getOperatorList(), signal);
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
          const annotations = await wordAbortable(page.getAnnotations(), signal);
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
          try { result.artwork = await extractWordArtwork(page, operators, result.warnings, signal, options.maxRenderPixels); }
          catch (error: any) { throw new Error(`Page ${number}: artwork could not be preserved reliably: ${error?.message || error}`); }
        }
        result.warnings = [...new Set(result.warnings)];
        retainedBytes += result.artwork.reduce((sum, asset) => sum + asset.data.byteLength, 0) +
          result.lines.reduce((sum, line) => sum + line.spans.reduce((size, span) => size + span.text.length * 2 + 160, 0), 0);
        if (retainedBytes > 192 * 1048576) throw new Error('Reconstructed content exceeded the conservative 192 MB in-memory output budget. Choose a smaller page range. No partial download was triggered.');
        pages.push(result);
      } finally { page.cleanup(); }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    wordAbort(signal);
    return pages;
  } catch (error: any) {
    wordAbort(signal);
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Unlock it before converting to Word.');
    if (error?.name === 'InvalidPDFException') throw new Error('This PDF is malformed or damaged; no DOCX was generated.');
    if (error instanceof RangeError || /out of memory|allocation failed/i.test(error?.message || ''))
      throw new Error('Browser memory was exhausted. Close other tabs and select a smaller page range; Safari and mobile memory limits can be lower.');
    throw error;
  } finally {
    signal?.removeEventListener('abort', abort);
    await worker?.terminate().catch(() => {});
    await task?.destroy().catch(() => {});
    pdfWorker.destroy(); nativeWorker.terminate();
  }
}

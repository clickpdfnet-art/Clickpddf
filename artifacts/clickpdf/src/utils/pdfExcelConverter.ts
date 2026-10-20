import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { Worker as TesseractWorker } from 'tesseract.js';
import { initPdfWorker } from './pdfWorkerSetup';
import { SUPPORTED_OCR_LANGUAGES } from './ocrLanguages';
import { groupExcelLines, findExcelTables, combineExcelTables, tableToPreview, allTextToPreview } from './pdfExcelTables';
import { buildPdfExcelWorkbook, uniqueExcelSheetName } from './pdfExcelWorkbook';
import type { ExcelFragment, ExcelPage, ExcelSheetPreview, PdfExcelOptions, PdfExcelResult } from './pdfExcelTypes';

function assertActive(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
}
function hasScannedContent(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  // Sample progressively to avoid allocating multiple full-size scan buffers.
  const sample = document.createElement('canvas');
  sample.width = Math.min(320, canvas.width);
  sample.height = Math.min(320, canvas.height);
  const context = sample.getContext('2d')!;
  context.drawImage(canvas, 0, 0, sample.width, sample.height);
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
  sample.width = sample.height = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] > 10 && Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) < 235) return true;
  }
  return false;
}
function detectedGrid(page: pdfjs.PDFPageProxy, operators: { fnArray: number[]; argsArray: any[][] }) {
  const boxes = operators.fnArray.flatMap((op, index) => {
    const args = operators.argsArray[index];
    const bbox = args?.[2];
    if (op !== pdfjs.OPS.constructPath || !bbox || bbox.length !== 4) return [];
    const width = Math.abs(bbox[2] - bbox[0]), height = Math.abs(bbox[3] - bbox[1]);
    return width > 15 && height > 8 && width < page.view[2] * .9 && height < page.view[3] * .35
      ? [{ x: bbox[0], y: bbox[1], width, height }] : [];
  });
  // Repeated similarly sized rectangular cell borders at two different x/y coordinates.
  return boxes.some(box => {
    const siblings = boxes.filter(other =>
      Math.abs(other.width - box.width) < Math.max(9, box.width * .15) &&
      Math.abs(other.height - box.height) < Math.max(5, box.height * .22));
    return siblings.length >= 4 &&
      siblings.some(other => Math.abs(other.x - box.x) > 12) &&
      siblings.some(other => Math.abs(other.y - box.y) > 8);
  });
}
function cleanPdfError(error: any) {
  if (error?.name === 'PasswordException') return new Error('This PDF is encrypted. Unlock it before converting to Excel.');
  if (error?.name === 'InvalidPDFException' || /invalid pdf|missing pdf|invalid xref/i.test(error?.message || ''))
    return new Error('The PDF is damaged or is not a valid PDF document.');
  if (error?.name === 'AbortError') return error;
  if (error instanceof RangeError || /out of memory|allocation failed|canvas.*large/i.test(error?.message || ''))
    return new Error('This document exceeds available browser memory. Try fewer/smaller PDFs or close other browser tabs.');
  return error instanceof Error ? error : new Error(String(error));
}

/** Only PDF-to-Excel calls this; other Office conversion engines remain unchanged. */
export async function convertAdvancedPdfToExcel(
  file: File, options: PdfExcelOptions, onProgress?: (current: number, total: number, status: string) => void,
  signal?: AbortSignal
): Promise<PdfExcelResult> {
  if (options.mode === 'ocr' && !SUPPORTED_OCR_LANGUAGES.some(language => language.code === options.language))
    throw new Error('Selected OCR language has no supported model.');
  initPdfWorker();
  const objectUrl = URL.createObjectURL(file);
  const loading = pdfjs.getDocument({ url: objectUrl, stopAtErrors: true });
  let worker: TesseractWorker | undefined;
  const pages: ExcelPage[] = [];
  const onAbort = () => { void worker?.terminate().catch(() => {}); };
  signal?.addEventListener('abort', onAbort, { once: true });
  try {
    assertActive(signal);
    const pdf = await loading.promise;
    for (let number = 1; number <= pdf.numPages; number++) {
      assertActive(signal);
      onProgress?.(number, pdf.numPages, `Reading page ${number}/${pdf.numPages}…`);
      const page = await pdf.getPage(number), viewport = page.getViewport({ scale: 1 });
      const result: ExcelPage = { number, width: viewport.width, height: viewport.height, lines: [],
        ruled: false, scanned: false, issues: [] };
      try {
        const content = await page.getTextContent();
        const spans: ExcelFragment[] = [];
        for (const item of content.items) {
          if (!('str' in item) || !item.str.trim()) continue;
          const transformed = pdfjs.Util.transform(viewport.transform, item.transform);
          const size = Math.hypot(transformed[2], transformed[3]) || item.height || 12;
          const style = content.styles[item.fontName];
          let font = style?.fontFamily || '';
          try { if (page.commonObjs.has(item.fontName)) font = page.commonObjs.get(item.fontName)?.name || font; }
          catch { /* getTextContent's font family remains usable. */ }
          spans.push({ text: item.str, x: transformed[4], y: transformed[5] - size * (style?.ascent ?? .85),
            width: item.width, height: Math.max(item.height, size), size,
            bold: /bold|heavy|black|demi/i.test(font), italic: /italic|oblique/i.test(font),
            rtl: item.dir === 'rtl', page: number });
        }
        if (spans.length) {
          result.lines = groupExcelLines(spans);
          if (options.mode !== 'text') result.ruled = detectedGrid(page, await page.getOperatorList());
        } else if (options.mode !== 'ocr') {
          const operations = await page.getOperatorList();
          const painted = operations.fnArray.some(op => op === pdfjs.OPS.paintImageXObject ||
            op === pdfjs.OPS.paintInlineImageXObject || op === pdfjs.OPS.paintImageXObjectRepeat ||
            op === pdfjs.OPS.constructPath || op === pdfjs.OPS.shadingFill);
          result.issues.push(painted
            ? `Page ${number}: no selectable text. Choose Scanned PDF / OCR to recognize an image-only page.`
            : `Page ${number} is blank; no cells were invented.`);
        } else {
          const scale = Math.min(2, Math.sqrt(9_000_000 / Math.max(1, viewport.width * viewport.height)));
          const canvasViewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(canvasViewport.width); canvas.height = Math.ceil(canvasViewport.height);
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Browser canvas is unavailable for scanned PDF OCR.');
          try {
            await page.render({ canvas, canvasContext: context, viewport: canvasViewport }).promise;
            assertActive(signal);
            if (!hasScannedContent(canvas)) { result.issues.push(`Page ${number} is blank; no invented table or cell was added.`); pages.push(result); continue; }
            onProgress?.(number, pdf.numPages, `OCR page ${number}/${pdf.numPages}: ${options.language} (model is loaded only for scanned pages)…`);
            if (!worker) {
              const { default: Tesseract } = await import('tesseract.js');
              worker = await Tesseract.createWorker(options.language);
              assertActive(signal);
            }
            const recognized = await worker.recognize(canvas, {}, { text: true, blocks: true });
            assertActive(signal);
            const words: ExcelFragment[] = [];
            for (const block of recognized.data.blocks || []) for (const paragraph of block.paragraphs)
              for (const line of paragraph.lines) for (const word of line.words) {
                if (!word.text.trim()) continue;
                words.push({ text: word.text, x: word.bbox.x0 / scale, y: word.bbox.y0 / scale,
                  width: (word.bbox.x1 - word.bbox.x0) / scale, height: (word.bbox.y1 - word.bbox.y0) / scale,
                  size: Math.max(7, (word.bbox.y1 - word.bbox.y0) / scale * .85),
                  bold: false, italic: false, rtl: /[\u0590-\u08ff]/u.test(word.text), page: number });
              }
            result.scanned = true; result.confidence = Math.round(recognized.data.confidence || 0);
            result.lines = groupExcelLines(words);
            if (!result.lines.length && recognized.data.text.trim()) {
              result.lines = groupExcelLines(recognized.data.text.trim().split('\n').filter(Boolean).map((text, index) =>
                ({ text, x: 20, y: 20 + index * 17, width: viewport.width - 40, height: 14,
                  size: 12, bold: false, italic: false, rtl: /[\u0590-\u08ff]/u.test(text), page: number })));
              result.issues.push(`Page ${number}: OCR returned text without word positions. Table columns cannot be reconstructed reliably.`);
            }
            result.issues.push(`Page ${number}: OCR confidence ${result.confidence}%; check all extracted words, numbers, empty cells and table boundaries.`);
          } catch (error: any) {
            if (signal?.aborted) throw new DOMException('Conversion cancelled.', 'AbortError');
            throw new Error(`Page ${number}: OCR or the ${options.language} language model failed. ${error?.message || error}`);
          } finally { canvas.width = canvas.height = 0; }
        }
        pages.push(result);
      } finally { page.cleanup(); }
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    assertActive(signal);
    onProgress?.(pdf.numPages, pdf.numPages, 'Reconstructing spreadsheet rows and verifying XLSX…');
    const nameSet = new Set<string>();
    const issues = new Set(pages.flatMap(page => page.issues));
    const sheets: ExcelSheetPreview[] = [];
    if (options.mode === 'text') {
      const sheet = allTextToPreview(pages, file.name, 'All Text', options.numberLocale);
      sheet.name = uniqueExcelSheetName(sheet.name, nameSet);
      sheets.push(sheet);
    } else {
      const tables = combineExcelTables(pages, options.combineContinued);
      for (const [index, table] of tables.entries()) {
        const name = uniqueExcelSheetName(`Table ${index + 1}${table.title ? ` - ${table.title}` : ''}`, nameSet);
        sheets.push(tableToPreview(table, file.name, name, pages, options.numberLocale));
      }
      if (options.mode === 'ocr') for (const page of pages) {
        if (!page.lines.length || findExcelTables(page).length) continue;
        const name = uniqueExcelSheetName(`${page.scanned ? 'OCR ' : ''}Text P${page.number}`, nameSet);
        const sheet = allTextToPreview([page], file.name, name, options.numberLocale);
        sheet.issues.push(page.scanned
          ? 'No reliable table grid detected on this scan. Recognized text remains editable, but table columns were not guessed.'
          : 'No table detected on this page; readable text was retained in editable rows.');
        sheets.push(sheet);
      }
      if (!sheets.length) {
        throw new Error(options.mode === 'tables'
          ? 'No reliable table detected. Select Extract All Text, or choose Scanned PDF / OCR for an image-only PDF.'
          : 'OCR found no readable text or table. Try another OCR language or a clearer scan.');
      }
      if (options.mode === 'tables') {
        const tablePages = new Set(tables.flatMap(table => table.pages));
        for (const page of pages) if (page.lines.length && !tablePages.has(page.number)) issues.add(`Page ${page.number}: text without a detected table was omitted in Extract Tables mode.`);
      }
    }
    sheets.flatMap(sheet => sheet.issues).forEach(issue => issues.add(issue));
    return await buildPdfExcelWorkbook(sheets, file.name, pages.length, pages.filter(page => page.scanned).map(page => page.number), [...issues]);
  } catch (error) { throw cleanPdfError(error); }
  finally {
    signal?.removeEventListener('abort', onAbort);
    await worker?.terminate().catch(() => {});
    await loading.destroy().catch(() => {});
    URL.revokeObjectURL(objectUrl);
  }
}

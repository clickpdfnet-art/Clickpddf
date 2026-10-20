import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { initPdfWorker } from './pdfWorkerSetup';
import { textItemsToLines, linesToTextAndMarkdown, ExtractedTextItem } from './pdfTextFormatting';

export interface PdfTextResult {
  text: string;
  markdown: string;
  pages: number;
  emptyPages: number[];
  warnings: string[];
}

/** Read each page once, using a Blob URL instead of a second full PDF buffer. */
export async function extractPdfText(
  file: File,
  onProgress: (page: number, total: number) => void,
  signal: AbortSignal
): Promise<PdfTextResult> {
  initPdfWorker();
  const url = URL.createObjectURL(file);
  const loading = pdfjs.getDocument({ url, stopAtErrors: true });
  const abort = () => { void loading.destroy().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    if (signal.aborted) throw new DOMException('Extraction cancelled.', 'AbortError');
    const pdf = await loading.promise;
    const textPages: string[] = [];
    const markdownPages: string[] = [];
    const emptyPages: number[] = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      if (signal.aborted) throw new DOMException('Extraction cancelled.', 'AbortError');
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        const items = content.items.filter(item => 'str' in item);
        const converted = linesToTextAndMarkdown(textItemsToLines(items as ExtractedTextItem[]));
        if (!converted.text) emptyPages.push(number);
        textPages.push(converted.text);
        markdownPages.push(converted.markdown);
        onProgress(number, pdf.numPages);
      } finally {
        page.cleanup();
      }
      // Let progress, cancellation and file controls paint between pages.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    if (!textPages.some(text => text.trim())) {
      throw new Error('No selectable text was found. This PDF may be scanned images or blank pages. OCR is required for scanned documents; this tool does not invent missing text.');
    }
    return {
      text: textPages.join('\n\n\f\n\n'),
      markdown: markdownPages.join('\n\n---\n\n'),
      pages: pdf.numPages,
      emptyPages,
      warnings: emptyPages.length
        ? [`No selectable text on page(s) ${emptyPages.join(', ')}. Text on scanned pages requires OCR.`]
        : []
    };
  } catch (error: any) {
    if (signal.aborted) throw new DOMException('Extraction cancelled.', 'AbortError');
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Unlock it first, then extract its text.');
    throw error;
  } finally {
    signal.removeEventListener('abort', abort);
    await loading.destroy().catch(() => {});
    URL.revokeObjectURL(url);
  }
}

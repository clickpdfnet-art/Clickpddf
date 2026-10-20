import { extractWordPages } from './pdfWordExtraction';
import { buildAdvancedWord } from './pdfWordDocx';
import { DEFAULT_PDF_WORD_OPTIONS } from './pdfWordTypes';
import type { PdfWordOptions, AdvancedWordResult } from './pdfWordTypes';

export async function convertAdvancedPdfToWord(
  file: File, progress?: (current: number, total: number, text: string) => void,
  language = 'eng', options: PdfWordOptions = DEFAULT_PDF_WORD_OPTIONS
): Promise<AdvancedWordResult> {
  const pages = await extractWordPages(file, options, language, progress || (() => {}));
  if (!pages.length) throw new Error('The PDF contains no convertible pages.');
  progress?.(pages.length, pages.length, 'Building genuine Word sections, text, tables and artwork…');
  const result = await buildAdvancedWord(pages, options, file.name.replace(/\.pdf$/i, ''));
  return { ...result, fileName: `${file.name.replace(/\.pdf$/i, '')}.docx`, pageCount: pages.length,
    details: `${pages.length} source page(s) converted in ${options.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} mode. ${result.report.fallbackPages.length} page(s) use non-editable image fallback. Review the conversion quality report before relying on layout.` };
}

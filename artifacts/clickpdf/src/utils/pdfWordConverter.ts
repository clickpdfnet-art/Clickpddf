import { extractWordPages } from './pdfWordExtraction';
import { buildAdvancedWord } from './pdfWordDocx';
import { DEFAULT_PDF_WORD_OPTIONS } from './pdfWordTypes';
import type { PdfWordOptions, AdvancedWordResult } from './pdfWordTypes';
import { wordAbort, wordAbortable } from './pdfWordRuntimeChecks';

export async function convertAdvancedPdfToWord(
  file: File, progress?: (current: number, total: number, text: string) => void,
  language = 'eng', options: PdfWordOptions = DEFAULT_PDF_WORD_OPTIONS, signal?: AbortSignal
): Promise<AdvancedWordResult> {
  const pages = await extractWordPages(file, options, language, progress || (() => {}), signal);
  wordAbort(signal);
  if (!pages.length) throw new Error('The PDF contains no convertible pages.');
  progress?.(pages.length, pages.length, 'Building genuine Word sections, text, tables and artwork…');
  const result = await wordAbortable(buildAdvancedWord(pages, options, file.name.replace(/\.pdf$/i, ''), signal), signal);
  wordAbort(signal);
  const partial = pages.some(page => page.warnings.some(warning => warning.startsWith('PARTIAL OUTPUT')));
  return { ...result, fileName: `${file.name.replace(/\.pdf$/i, '')}${partial ? '_partial' : ''}.docx`, pageCount: pages.length,
    details: `${partial ? 'PARTIAL TEXT-ONLY OUTPUT — some scanned pages contain notices, not recovered content. ' : ''}${pages.length} selected source page(s) converted in ${options.mode === 'layout' ? 'Layout-Preserved' : 'Editable'} mode. ${result.report.fallbackPages.length} page(s) use non-editable image fallback. Review the conversion quality report before relying on layout.` };
}

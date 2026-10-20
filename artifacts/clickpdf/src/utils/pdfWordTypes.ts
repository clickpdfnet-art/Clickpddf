export type PdfWordMode = 'editable' | 'layout';
export interface PdfWordOptions {
  mode: PdfWordMode;
  imageFallback: 'never' | 'unrecognized' | 'all';
  enableOcr?: boolean;
  forceOcr?: boolean;
  additionalLanguages?: string[];
  lockLanguages?: boolean;
  pageModels?: string;
  pageRange?: string;
  maxRenderPixels?: number;
  allowPartialText?: boolean;
}
export const DEFAULT_PDF_WORD_OPTIONS: PdfWordOptions = { mode: 'editable', imageFallback: 'never' };
export interface WordSpan {
  text: string; x: number; y: number; width: number; height: number;
  size: number; font: string; color: string; bold: boolean; italic: boolean;
  rtl: boolean; link?: string;
}
export interface WordLine { spans: WordSpan[]; x: number; y: number; width: number; height: number; rtl: boolean }
export interface WordArtwork {
  data: Uint8Array; x: number; y: number; width: number; height: number;
  role: 'image' | 'artwork' | 'page-image';
}
export interface WordPage {
  number: number; width: number; height: number;
  lines: WordLine[]; artwork: WordArtwork[]; ruled: boolean; ocr: boolean;
  warnings: string[];
  language?: { selectedModels: string[]; script: string; candidates: string[]; confidence: number; languageConfidence: number; note: string };
}
export interface PdfWordPageReport {
  page: number; width: number; height: number; textLines: number;
  images: number; artworkLayers: number; tables: number; ocr: boolean;
  rasterPage: boolean; warnings: string[];
  language?: WordPage['language'];
}
export interface PdfWordReport {
  mode: PdfWordMode; pages: PdfWordPageReport[]; warnings: string[];
  fonts: string[]; fallbackPages: number[];
}
export interface AdvancedWordResult {
  data: Uint8Array; fileName: string; details: string; pageCount: number;
  report: PdfWordReport;
}

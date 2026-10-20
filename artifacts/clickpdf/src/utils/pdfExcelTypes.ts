export type PdfExcelMode = 'tables' | 'text' | 'ocr';
export type PdfExcelLocale = 'auto' | 'dot' | 'comma';
export interface PdfExcelOptions {
  mode: PdfExcelMode;
  language: string;
  combineContinued: boolean;
  numberLocale: PdfExcelLocale;
}
export const DEFAULT_PDF_EXCEL_OPTIONS: PdfExcelOptions = { mode: 'tables', language: 'eng', combineContinued: true, numberLocale: 'auto' };
export interface ExcelFragment {
  text: string; x: number; y: number; width: number; height: number; size: number;
  bold: boolean; italic: boolean; rtl: boolean; page: number;
}
export interface ExcelCell {
  text: string; value: string | number | Date; format?: string; kind: 'text' | 'number' | 'date';
  bold: boolean; italic: boolean; rtl: boolean;
}
export interface ExcelLine {
  y: number; height: number; fragments: ExcelFragment[];
  cells: { x: number; right: number; fragments: ExcelFragment[]; text: string }[];
}
export interface ExcelPage {
  number: number; height: number; width: number; lines: ExcelLine[];
  ruled: boolean; scanned: boolean; confidence?: number; issues: string[];
}
export interface ExcelTable {
  pages: number[]; sourceRows: ExcelLine[]; columnX: number[];
  title?: string; ruled: boolean; ocr: boolean; issues: string[];
}
export interface ExcelSheetPreview {
  name: string; type: 'table' | 'text'; pages: number[];
  rows: ExcelCell[][]; issues: string[]; rtl?: boolean;
  sourceFile: string;
}
export interface PdfExcelResult {
  data: Uint8Array; fileName: string; sheets: ExcelSheetPreview[];
  issues: string[]; pageCount: number; scannedPages: number[];
}

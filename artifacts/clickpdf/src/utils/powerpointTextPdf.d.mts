export type PowerPointTextProgress = (current: number, total: number) => void;

export interface PowerPointTextPdfResult {
  data: Uint8Array;
  fileName: string;
  pageCount: number;
  details: string;
}

export function extractPowerPointSlideLines(xmlText: string): Array<{
  text: string;
  isBold: boolean;
  isTitle: boolean;
}>;
export function isSupportedPowerPointFile(fileName: string): boolean;
export function convertPptxTextToPdf(
  fileBytes: Uint8Array,
  fileName: string,
  onProgress?: PowerPointTextProgress,
): Promise<PowerPointTextPdfResult>;

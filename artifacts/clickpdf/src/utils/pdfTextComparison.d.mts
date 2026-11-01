export interface PdfTextComparisonDocument {
  fileName: string;
  text: string;
  pages: number;
  emptyPages: number[];
}

export function buildPdfTextComparisonReport(
  original: PdfTextComparisonDocument,
  revised: PdfTextComparisonDocument,
): string;

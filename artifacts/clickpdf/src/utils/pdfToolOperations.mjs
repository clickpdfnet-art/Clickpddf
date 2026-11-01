import { PDFDocument } from 'pdf-lib';

export async function cropPdfMargins(pdfBytes, marginPercent) {
  if (!Number.isFinite(marginPercent) || marginPercent < 0 || marginPercent > 25) {
    throw new Error('Crop margin must be between 0 and 25 percent.');
  }

  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
  if (pdf.getPageCount() === 0) throw new Error('The PDF has no pages to crop.');

  for (const page of pdf.getPages()) {
    const box = page.getCropBox();
    const margin = Math.min(box.width, box.height) * marginPercent / 100;
    const width = box.width - margin * 2;
    const height = box.height - margin * 2;
    if (width < 36 || height < 36) {
      throw new Error('The selected crop margin would leave a page too small. Choose a smaller margin.');
    }
    page.setCropBox(box.x + margin, box.y + margin, width, height);
  }

  return pdf.save({ useObjectStreams: true, objectsPerTick: 25 });
}

export async function repairPdfBytes(pdfBytes) {
  const pdf = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: false,
    throwOnInvalidObject: false,
  });
  const originalPageCount = pdf.getPageCount();
  if (originalPageCount === 0) throw new Error('No recoverable pages were found in this PDF.');

  const repaired = await pdf.save({ useObjectStreams: true, objectsPerTick: 25 });
  const verified = await PDFDocument.load(repaired, { ignoreEncryption: false });
  if (verified.getPageCount() !== originalPageCount) {
    throw new Error('The rebuilt PDF did not retain the original page count.');
  }
  return repaired;
}

import { PDFDocument, concatTransformationMatrix, drawObject, popGraphicsState, pushGraphicsState } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { initPdfWorker } from './pdfWorkerSetup';

export interface SignPdfPlacement {
  id: string;
  signatureId: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
}

export interface SignPdfSignature {
  id: string;
  dataUrl: string;
  aspectRatio: number;
}

export interface SignPdfPageSelection {
  mode: 'current' | 'all' | 'custom' | 'placed';
  currentPage: number;
  customPages: string;
  placementsByPage?: Record<number, SignPdfPlacement[]>;
}

export interface SignPdfInspection {
  pageCount: number;
  bytes: Uint8Array;
}

export const MAX_SIGN_PDF_FILE_BYTES = 150 * 1024 * 1024;
export const MAX_SIGN_PNG_FILE_BYTES = 5 * 1024 * 1024;
export const LARGE_SIGN_PDF_WARNING_BYTES = 50 * 1024 * 1024;

export function readableSignPdfError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '');
  const lower = message.toLowerCase();
  if (/encrypt|password|credential/.test(lower)) {
    return 'This PDF is password-protected or encrypted. Remove its password in a trusted PDF app, then try again.';
  }
  if (/memory|allocation|array buffer|out of memory|rangeerror/.test(lower)) {
    return 'The browser ran out of memory while opening this PDF. Close other tabs or try a smaller file.';
  }
  if (/invalid pdf|missing.*header|unexpected.*eof|failed to parse|invalid object/.test(lower)) {
    return 'This file is damaged or is not a valid PDF. The original file has not been changed.';
  }
  return message ? `The PDF could not be processed: ${message}` : 'The PDF could not be processed. The original file has not been changed.';
}

export async function inspectSignPdfFile(file: File): Promise<SignPdfInspection> {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file with a .pdf extension.');
  }
  if (!file.size) throw new Error('This file is empty.');
  if (file.size > MAX_SIGN_PDF_FILE_BYTES) {
    throw new Error('This signing tool currently supports files up to 150 MB each to reduce the risk of exhausting browser memory.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder().decode(bytes.subarray(0, 5));
  if (header !== '%PDF-') throw new Error('The selected file does not contain a valid PDF header.');

  const pdf = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    throwOnInvalidObject: true,
    updateMetadata: false,
  });
  const pageCount = pdf.getPageCount();
  if (!pageCount) throw new Error('This PDF does not contain any pages.');
  return { pageCount, bytes };
}

export async function parseSignPdfPages(input: string, pageCount: number): Promise<number[]> {
  const parts = input.split(',').map(part => part.trim()).filter(Boolean);
  if (!parts.length) throw new Error('Enter one or more page numbers, such as 1, 3-5.');
  const pages = new Set<number>();
  for (const part of parts) {
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const single = part.match(/^\d+$/);
    if (!range && !single) throw new Error(`"${part}" is not a valid page number or range.`);
    const start = Number(range?.[1] || part);
    const end = Number(range?.[2] || part);
    if (start < 1 || end > pageCount || end < start) {
      throw new Error(`Page selection must be between 1 and ${pageCount}.`);
    }
    for (let page = start; page <= end; page += 1) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',');
  if (comma < 0 || !dataUrl.slice(0, comma).includes('image/png')) {
    throw new Error('The signature image is not a valid PNG.');
  }
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function rotatePoint(x: number, y: number, cx: number, cy: number, radians: number) {
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + Math.cos(radians) * dx - Math.sin(radians) * dy,
    y: cy + Math.sin(radians) * dx + Math.cos(radians) * dy,
  };
}

function pdfImageMatrix(
  viewport: any,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
) {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radians = (rotation * Math.PI) / 180;
  const bottomLeft = rotatePoint(x, y + height, centerX, centerY, radians);
  const bottomRight = rotatePoint(x + width, y + height, centerX, centerY, radians);
  const topLeft = rotatePoint(x, y, centerX, centerY, radians);
  const origin = viewport.convertToPdfPoint(bottomLeft.x, bottomLeft.y);
  const xPoint = viewport.convertToPdfPoint(bottomRight.x, bottomRight.y);
  const yPoint = viewport.convertToPdfPoint(topLeft.x, topLeft.y);

  // The inverse PDF.js viewport transform makes this matrix account for page
  // rotation, crop-box offsets, zoom-independent dimensions and PDF user units.
  return [
    xPoint[0] - origin[0],
    xPoint[1] - origin[1],
    yPoint[0] - origin[0],
    yPoint[1] - origin[1],
    origin[0],
    origin[1],
  ] as const;
}

function clampRotatedBox(x: number, y: number, width: number, height: number, rotation: number, pageWidth: number, pageHeight: number) {
  const radians = (rotation * Math.PI) / 180;
  let fittedWidth = width;
  let fittedHeight = height;
  const boundsWidth = Math.abs(Math.cos(radians)) * width + Math.abs(Math.sin(radians)) * height;
  const boundsHeight = Math.abs(Math.sin(radians)) * width + Math.abs(Math.cos(radians)) * height;
  const factor = Math.min(1, pageWidth / boundsWidth, pageHeight / boundsHeight);
  fittedWidth *= factor;
  fittedHeight *= factor;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const nextBoundsWidth = Math.abs(Math.cos(radians)) * fittedWidth + Math.abs(Math.sin(radians)) * fittedHeight;
  const nextBoundsHeight = Math.abs(Math.sin(radians)) * fittedWidth + Math.abs(Math.cos(radians)) * fittedHeight;
  const nextCx = Math.max(nextBoundsWidth / 2, Math.min(pageWidth - nextBoundsWidth / 2, cx));
  const nextCy = Math.max(nextBoundsHeight / 2, Math.min(pageHeight - nextBoundsHeight / 2, cy));
  return { x: nextCx - fittedWidth / 2, y: nextCy - fittedHeight / 2, width: fittedWidth, height: fittedHeight };
}

export async function applySignPdfPlacements(
  source: File,
  signatures: SignPdfSignature[],
  placements: SignPdfPlacement[],
  selection: SignPdfPageSelection,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const placedPages = Object.entries(selection.placementsByPage || {})
    .filter(([, pagePlacements]) => pagePlacements.length > 0)
    .map(([page]) => Number(page))
    .sort((a, b) => a - b);
  if (!placements.length && !(selection.mode === 'placed' && placedPages.length)) {
    throw new Error('Add at least one signature to the selected page before saving.');
  }
  if (signal?.aborted) throw new DOMException('Signing was cancelled.', 'AbortError');
  if (!source.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF file with a .pdf extension.');
  if (!source.size) throw new Error('This file is empty.');
  if (source.size > MAX_SIGN_PDF_FILE_BYTES) throw new Error('This signing tool currently supports files up to 150 MB each to reduce the risk of exhausting browser memory.');
  const bytes = new Uint8Array(await source.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') throw new Error('The selected file does not contain a valid PDF header.');
  if (signal?.aborted) throw new DOMException('Signing was cancelled.', 'AbortError');
  const pdfDoc = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    throwOnInvalidObject: true,
    updateMetadata: false,
  });
  const pageCount = pdfDoc.getPageCount();
  if (!pageCount) throw new Error('This PDF does not contain any pages.');

  initPdfWorker();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes), stopAtErrors: true, enableXfa: false, useWorkerFetch: false });
  let previewPdf: any;
  try {
    previewPdf = await loadingTask.promise;
    const selectedPages = selection.mode === 'all'
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : selection.mode === 'custom'
        ? await parseSignPdfPages(selection.customPages, pageCount)
        : selection.mode === 'placed'
          ? placedPages
          : [selection.currentPage];

    const placementsBySignature = new Map<string, SignPdfSignature>();
    for (const signature of signatures) placementsBySignature.set(signature.id, signature);
    const embedded = new Map<string, any>();

    for (const pageNumber of selectedPages) {
      if (signal?.aborted) throw new DOMException('Signing was cancelled.', 'AbortError');
      const page = pdfDoc.getPage(pageNumber - 1);
      const previewPage = await previewPdf.getPage(pageNumber);
      const viewport = previewPage.getViewport({ scale: 1 });
      const pageWidth = viewport.width;
      const pageHeight = viewport.height;
      const targetPlacements = selection.mode === 'placed'
        ? selection.placementsByPage?.[pageNumber] || []
        : placements;
      const pageTemplates = targetPlacements.map(placement => {
        const signature = placementsBySignature.get(placement.signatureId);
        if (!signature) throw new Error('A signature image was removed. Recreate it before saving.');
        return { placement, signature };
      });

      for (const { placement, signature } of pageTemplates) {
        if (signal?.aborted) throw new DOMException('Signing was cancelled.', 'AbortError');
        let image = embedded.get(signature.id);
        if (!image) {
          image = await pdfDoc.embedPng(dataUrlToBytes(signature.dataUrl));
          embedded.set(signature.id, image);
        }
        const rawWidth = Math.max(1, placement.width * pageWidth);
        const rawHeight = rawWidth / Math.max(0.05, signature.aspectRatio);
        const x = placement.x * pageWidth;
        const y = placement.y * pageHeight;
        const fitted = clampRotatedBox(x, y, rawWidth, rawHeight, placement.rotation, pageWidth, pageHeight);
        const matrix = pdfImageMatrix(viewport, fitted.x, fitted.y, fitted.width, fitted.height, placement.rotation);
        const imageName = page.node.newXObject('Image', image.ref);
        page.pushOperators(
          pushGraphicsState(),
          concatTransformationMatrix(...matrix),
          drawObject(imageName),
          popGraphicsState(),
        );
      }
      previewPage.cleanup();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }

    return await pdfDoc.save({ useObjectStreams: true });
  } finally {
    await loadingTask.destroy().catch(() => {});
    if (previewPdf) await previewPdf.destroy().catch(() => {});
  }
}

export function createSignPdfPreviewTask(bytes: Uint8Array) {
  initPdfWorker();
  return pdfjs.getDocument({
    data: new Uint8Array(bytes),
    stopAtErrors: true,
    enableXfa: false,
    useWorkerFetch: false,
  });
}

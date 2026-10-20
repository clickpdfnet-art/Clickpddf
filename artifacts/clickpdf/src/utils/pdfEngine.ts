import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { initPdfWorker } from './pdfWorkerSetup';
import { runPdfBackground } from './pdfBackground';
import {
  readSafeArrayBuffer,
  yieldToMainThread,
  formatMemoryErrorMessage,
  isMemoryError
} from './memoryManager';

/**
 * Downloads a Uint8Array or Blob directly in browser with no server roundtrip.
 */
export function downloadBlob(data: Uint8Array | Blob, fileName: string, mimeType?: string) {
  try {
    let resolvedMime = mimeType;
    if (!resolvedMime || resolvedMime === 'application/pdf') {
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.docx')) resolvedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (lower.endsWith('.xlsx')) resolvedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (lower.endsWith('.pptx')) resolvedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (lower.endsWith('.zip')) resolvedMime = 'application/zip';
      else resolvedMime = 'application/pdf';
    }
    const blob = new Blob([data as unknown as BlobPart], { type: resolvedMime });

    // Handle legacy MS Edge / IE
    if (typeof (window.navigator as any).msSaveOrOpenBlob === 'function') {
      (window.navigator as any).msSaveOrOpenBlob(blob, fileName);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.style.position = 'fixed';
    a.style.left = '-9999px';
    a.style.top = '-9999px';
    a.href = url;
    a.setAttribute('download', fileName);
    a.download = fileName;
    a.rel = 'noopener noreferrer';
    a.target = '_self';
    document.body.appendChild(a);

    // MouseEvent simulation ensures event propagation on iOS/mobile WebViews
    try {
      const evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      });
      a.dispatchEvent(evt);
    } catch {
      a.click();
    }

    // Keep the object URL alive for 2 minutes (120,000 ms)
    // On mobile devices (Android / iOS Safari), download managers stream the blob asynchronously.
    // Revoking after 1000ms previously caused mobile downloads to abort or fail!
    setTimeout(() => {
      try {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      } catch {}
    }, 120000);
  } catch (err) {
    console.error('Failed to download file via downloadBlob:', err);
  }
}

/**
 * Merge multiple PDF files into one with memory protection and dereferencing.
 */
export async function mergePdfFiles(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  if (typeof Worker !== 'undefined') return runPdfBackground('merge', files, onProgress);
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      let arrayBuffer: ArrayBuffer | null = null;
      try {
        arrayBuffer = await file.arrayBuffer();
      } catch {
        arrayBuffer = await readSafeArrayBuffer(file);
      }
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
      arrayBuffer = null; // Free raw ArrayBuffer memory immediately
      const pageIndices = pdf.getPageIndices();
      for (let offset = 0; offset < pageIndices.length; offset += 25) {
        const copiedPages = await mergedPdf.copyPages(pdf, pageIndices.slice(offset, offset + 25));
        for (const page of copiedPages) mergedPdf.addPage(page);
        await yieldToMainThread(0);
      }
    } catch (err) {
      throw new Error(formatMemoryErrorMessage(err, file.name));
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
    // Yield event loop to allow browser garbage collection of previous buffers
    await yieldToMainThread(40);
  }

  // Memory-safe save with compressed object streams to minimize RAM usage and file size
  return await mergedPdf.save({ useObjectStreams: true });
}

/**
 * Split a PDF file by extracting selected page numbers (1-indexed).
 */
export async function splitPdfFile(file: File, pageNumbersToKeep: number[]): Promise<Uint8Array> {
  let arrayBuffer: ArrayBuffer | null = null;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    arrayBuffer = await readSafeArrayBuffer(file);
  }
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  arrayBuffer = null; // Free raw ArrayBuffer memory immediately
  const newPdf = await PDFDocument.create();

  const totalPages = pdf.getPageCount();
  // Filter valid 0-indexed page numbers
  let indices = pageNumbersToKeep
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < totalPages);

  // If page numbers are out of range for this document, safely fallback to first page
  if (indices.length === 0) {
    indices = [0];
  }

  const copiedPages = await newPdf.copyPages(pdf, indices);
  copiedPages.forEach(p => newPdf.addPage(p));

  return await newPdf.save({ useObjectStreams: true });
}

export interface PageRotationMap {
  [pageNumber: number]: number; // pageNumber (1-indexed) -> rotation in degrees to add (+90, -90, +180, etc.)
}

export interface PdfPageDetail {
  pageNumber: number;
  width: number;
  height: number;
  initialRotation: number;
}

/**
 * Retrieve page details and existing rotations for all pages in a document.
 */
export async function getPdfPagesInfo(file: File): Promise<{
  pageCount: number;
  pages: PdfPageDetail[];
}> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  return {
    pageCount: pages.length,
    pages: pages.map((p, idx) => {
      const size = p.getSize();
      return {
        pageNumber: idx + 1,
        width: Math.round(size.width),
        height: Math.round(size.height),
        initialRotation: p.getRotation().angle || 0,
      };
    }),
  };
}

/**
 * Rotate PDF pages with support for individual pages or whole document clockwise and counter-clockwise.
 * pageRotations is a dictionary of 1-based page numbers to rotation deltas (+90, -90, +180, etc.)
 */
export async function rotatePdfPages(
  file: File,
  pageRotations: PageRotationMap,
  globalDelta: number = 0
): Promise<{ data: Uint8Array; rotatedCount: number; totalPages: number }> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const totalPages = pages.length;
  let rotatedCount = 0;

  pages.forEach((page, index) => {
    const pageNum = index + 1;
    const perPage = pageRotations[pageNum] !== undefined ? pageRotations[pageNum] : 0;
    const totalDelta = perPage + globalDelta;
    const currentRotation = page.getRotation().angle;
    const normalized = ((currentRotation + totalDelta) % 360 + 360) % 360;
    
    if (normalized !== currentRotation) {
      page.setRotation(degrees(normalized));
      rotatedCount++;
    }
  });

  const data = await pdf.save();
  return {
    data,
    rotatedCount,
    totalPages
  };
}

/**
 * Rotate all pages of a PDF by a given angle in degrees (90, 180, 270, -90).
 */
export async function rotatePdfFile(file: File, rotationDelta: number): Promise<Uint8Array> {
  const res = await rotatePdfPages(file, {}, rotationDelta);
  return res.data;
}

export interface WatermarkOptions {
  type?: 'text' | 'image';
  text?: string;
  imageFile?: File | Blob | string;
  imageDataUrl?: string;
  opacity: number;
  size: number;
  angle: number;
  colorHex?: string;
  xPercent?: number; // 0 (left) to 100 (right), default 50
  yPercent?: number; // 0 (top) to 100 (bottom), default 50
  fontFamily?: 'Helvetica' | 'Helvetica-Bold' | 'Times-Roman' | 'Times-Roman-Bold' | 'Courier' | 'Courier-Bold';
  pageRange?: 'all' | 'first' | 'last' | 'even' | 'odd' | string;
}

/**
 * Converts any image source (PNG, JPG, SVG, WebP, Blob, DataUrl) into PNG bytes for pdf-lib embedding.
 */
async function loadSourceAsPngBytes(
  source: File | Blob | string
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  let url = '';
  let shouldRevoke = false;
  if (typeof source === 'string') {
    url = source;
  } else {
    url = URL.createObjectURL(source);
    shouldRevoke = true;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, img.naturalWidth || img.width || 300);
        canvas.height = Math.max(1, img.naturalHeight || img.height || 300);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          if (shouldRevoke) URL.revokeObjectURL(url);
          return reject(new Error('Failed to create canvas context'));
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (shouldRevoke) URL.revokeObjectURL(url);
          if (!blob) return reject(new Error('Canvas export failed'));
          blob.arrayBuffer().then((buf) => {
            resolve({
              bytes: new Uint8Array(buf),
              width: canvas.width,
              height: canvas.height,
            });
          }).catch(reject);
        }, 'image/png');
      } catch (err) {
        if (shouldRevoke) URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      if (shouldRevoke) URL.revokeObjectURL(url);
      reject(new Error('Failed to load watermark image'));
    };
    img.src = url;
  });
}

/**
 * Add a custom text or image watermark with full coordinate control across target pages.
 */
export async function addWatermarkToPdf(
  file: File, 
  text: string, 
  options: WatermarkOptions
): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const isImage = options.type === 'image' && (options.imageFile || options.imageDataUrl);
  let embeddedImage: any = null;
  let imgNaturalWidth = 300;
  let imgNaturalHeight = 300;

  if (isImage) {
    try {
      const source = options.imageFile || options.imageDataUrl;
      if (source) {
        const { bytes, width, height } = await loadSourceAsPngBytes(source);
        embeddedImage = await pdf.embedPng(bytes);
        imgNaturalWidth = width;
        imgNaturalHeight = height;
      }
    } catch (err) {
      console.warn('Could not embed watermark image, falling back to text:', err);
    }
  }

  // Load font if text or if image fallback
  let font: any = null;
  const watermarkText = (options.text !== undefined ? options.text : text) || 'CONFIDENTIAL';
  if (!embeddedImage) {
    let fontName = StandardFonts.HelveticaBold;
    if (options.fontFamily === 'Times-Roman') fontName = StandardFonts.TimesRoman;
    else if (options.fontFamily === 'Times-Roman-Bold') fontName = StandardFonts.TimesRomanBold;
    else if (options.fontFamily === 'Courier') fontName = StandardFonts.Courier;
    else if (options.fontFamily === 'Courier-Bold') fontName = StandardFonts.CourierBold;
    else if (options.fontFamily === 'Helvetica') fontName = StandardFonts.Helvetica;
    font = await pdf.embedFont(fontName);
  }

  // Parse color hex (e.g. #EF4444)
  const hex = (options.colorHex || '#EF4444').replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '80', 16) / 255;
  const g = parseInt(hex.substring(2, 4) || '80', 16) / 255;
  const b = parseInt(hex.substring(4, 6) || '80', 16) / 255;

  const pages = pdf.getPages();
  const totalPages = pages.length;

  // Determine target pages based on pageRange
  const targetIndices = new Set<number>();
  const range = (options.pageRange || 'all').toLowerCase().trim();
  if (range === 'all') {
    for (let i = 0; i < totalPages; i++) targetIndices.add(i);
  } else if (range === 'first') {
    targetIndices.add(0);
  } else if (range === 'last') {
    targetIndices.add(totalPages - 1);
  } else if (range === 'odd') {
    for (let i = 0; i < totalPages; i += 2) targetIndices.add(i);
  } else if (range === 'even') {
    for (let i = 1; i < totalPages; i += 2) targetIndices.add(i);
  } else {
    // parse custom ranges like "1-3, 5"
    const parts = range.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const s = parseInt(startStr, 10);
        const e = parseInt(endStr, 10);
        if (!isNaN(s) && !isNaN(e)) {
          for (let p = Math.min(s, e); p <= Math.max(s, e); p++) {
            if (p >= 1 && p <= totalPages) targetIndices.add(p - 1);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
          targetIndices.add(p - 1);
        }
      }
    }
    if (targetIndices.size === 0) {
      for (let i = 0; i < totalPages; i++) targetIndices.add(i);
    }
  }

  const xPct = typeof options.xPercent === 'number' ? Math.max(0, Math.min(100, options.xPercent)) : 50;
  const yPct = typeof options.yPercent === 'number' ? Math.max(0, Math.min(100, options.yPercent)) : 50;
  const angleDeg = options.angle ?? 45;
  const rad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  for (let idx = 0; idx < totalPages; idx++) {
    if (!targetIndices.has(idx)) continue;
    const page = pages[idx];
    const { width, height } = page.getSize();

    // Target center point in PDF coordinates (origin at bottom-left)
    const xc = (xPct / 100) * width;
    const yc = (1 - (yPct / 100)) * height;

    if (embeddedImage) {
      // Scale image: size is percentage of page width (5% to 100%, default 40)
      const scalePct = Math.max(5, Math.min(100, options.size || 40)) / 100;
      const targetW = width * scalePct;
      const targetH = targetW * (imgNaturalHeight / imgNaturalWidth);

      const dx = targetW / 2;
      const dy = targetH / 2;
      const ox = dx * cosA - dy * sinA;
      const oy = dx * sinA + dy * cosA;

      page.drawImage(embeddedImage, {
        x: xc - ox,
        y: yc - oy,
        width: targetW,
        height: targetH,
        opacity: Math.max(0.01, Math.min(1, options.opacity)),
        rotate: degrees(angleDeg),
      });
    } else {
      const fontSize = options.size || 48;
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      const dx = textWidth / 2;
      const dy = textHeight / 2;
      const ox = dx * cosA - dy * sinA;
      const oy = dx * sinA + dy * cosA;

      page.drawText(watermarkText, {
        x: xc - ox,
        y: yc - oy,
        size: fontSize,
        font,
        color: rgb(r, g, b),
        opacity: Math.max(0.01, Math.min(1, options.opacity)),
        rotate: degrees(angleDeg),
      });
    }
  }

  return await pdf.save();
}

export type PageNumberFont =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Times-Roman'
  | 'Times-Roman-Bold'
  | 'Courier'
  | 'Courier-Bold';
export type PageNumberAlignment = 'left' | 'center' | 'right';
export type PageNumberPosition = 'footer' | 'header';

export interface AddPageNumbersOptions {
  alignment?: PageNumberAlignment;
  position?: PageNumberPosition | 'bottom-center' | 'bottom-right' | 'top-right' | 'top-center' | 'bottom-left' | 'top-left';
  format?: 'Page {n} of {total}' | '{n} / {total}' | '{n}' | '- {n} -' | 'Page {n}';
  startAt?: number; // Number to start counting from (e.g. 1)
  firstPageToNumber?: number; // 1-indexed document page where numbering begins (e.g. 1 or 2 to skip cover)
  skipCoverPage?: boolean;
  fontFamily?: PageNumberFont;
  fontSize?: number;
  margin?: number; // bottom/top margin in points
  colorHex?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * Add customizable page numbers to the footer or header of a PDF entirely in the browser.
 * Memory-safe and resilient for large files (30MB - 150MB+) with async UI yielding.
 */
export async function addPageNumbersToPdf(
  file: File,
  options: AddPageNumbersOptions
): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file);

  // Load with throwOnInvalidObject: false to seamlessly support large PDFs with loose xrefs or non-standard objects
  const pdf = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false
  });

  // Map requested font family to StandardFonts
  let standardFontName = StandardFonts.Helvetica;
  if (options.fontFamily === 'Helvetica-Bold') {
    standardFontName = StandardFonts.HelveticaBold;
  } else if (options.fontFamily === 'Times-Roman') {
    standardFontName = StandardFonts.TimesRoman;
  } else if (options.fontFamily === 'Times-Roman-Bold') {
    standardFontName = StandardFonts.TimesRomanBold;
  } else if (options.fontFamily === 'Courier') {
    standardFontName = StandardFonts.Courier;
  } else if (options.fontFamily === 'Courier-Bold') {
    standardFontName = StandardFonts.CourierBold;
  }

  const font = await pdf.embedFont(standardFontName);
  const pages = pdf.getPages();
  const total = pages.length;

  const fontSize = options.fontSize || 12;
  const startAt = options.startAt ?? 1;
  const firstPage = options.skipCoverPage ? 2 : (options.firstPageToNumber ?? 1);
  const format = options.format || 'Page {n} of {total}';
  const marginOffset = options.margin ?? 25;

  // Resolve alignment ('left' | 'center' | 'right')
  let alignment: PageNumberAlignment = options.alignment || 'center';
  if (options.position) {
    if (options.position === 'bottom-left' || options.position === 'top-left') {
      alignment = 'left';
    } else if (options.position === 'bottom-right' || options.position === 'top-right') {
      alignment = 'right';
    } else if (options.position === 'bottom-center' || options.position === 'top-center') {
      alignment = 'center';
    }
  }

  // Parse color hex (defaults to deep charcoal #334155)
  const hex = (options.colorHex || '#334155').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.2;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.25;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.35;

  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    const pageNum = index + 1; // 1-indexed

    // Yield to the browser event loop every 8 pages to avoid freezing on 30MB-100MB+ documents
    if (index > 0 && index % 8 === 0) {
      if (options.onProgress) {
        options.onProgress(pageNum, total);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Only number pages from firstPage onward
    if (pageNum < firstPage) {
      continue;
    }

    // Number displayed (e.g. if startAt=1 and firstPage=2, page 2 displays 1)
    const currentNum = (pageNum - firstPage) + startAt;
    const totalCounted = (total - firstPage + 1) + startAt - 1;

    let label = format
      .replace('{n}', currentNum.toString())
      .replace('{total}', Math.max(1, totalCounted).toString());

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = (width - textWidth) / 2; // default center
    const sidePadding = 36; // 0.5 inch from margins

    if (alignment === 'left') {
      x = sidePadding;
    } else if (alignment === 'right') {
      x = width - textWidth - sidePadding;
    } else {
      x = (width - textWidth) / 2;
    }

    // Determine Y coordinate (footer vs header)
    const isHeader = options.position === 'header' ||
      options.position === 'top-left' ||
      options.position === 'top-center' ||
      options.position === 'top-right';

    let y = marginOffset;
    if (isHeader) {
      y = height - marginOffset - fontSize;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  // Fast serialization with useObjectStreams: false for low RAM overhead
  return await pdf.save({ useObjectStreams: false });
}

export interface OrganizePageItem {
  originalIndex: number; // 0-based index of original page
  rotationDelta?: number; // additional rotation in degrees (0, 90, 180, 270)
}

/**
 * Reorder, duplicate, rotate, or delete pages visually and build a clean new PDF document.
 */
export async function organizePdfPagesWithRotations(
  file: File,
  pages: OrganizePageItem[]
): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const originalIndices = pages.map((p) => p.originalIndex);
  const copiedPages = await newPdf.copyPages(pdf, originalIndices);

  copiedPages.forEach((copiedPage, i) => {
    const rotDelta = pages[i]?.rotationDelta || 0;
    if (rotDelta !== 0) {
      const currentAngle = copiedPage.getRotation().angle || 0;
      copiedPage.setRotation(degrees(((currentAngle + rotDelta) % 360 + 360) % 360));
    }
    newPdf.addPage(copiedPage);
  });

  return await newPdf.save();
}

/**
 * Reorder, duplicate, or delete pages visually.
 */
export async function organizePdfPages(file: File, newPageIndices: number[]): Promise<Uint8Array> {
  return organizePdfPagesWithRotations(
    file,
    newPageIndices.map((originalIndex) => ({ originalIndex, rotationDelta: 0 }))
  );
}

/**
 * Render each page of a PDF to a PNG Blob without retaining page canvases or base64 copies.
 */
export async function renderPdfPagesToPng(
  pdfBytes: Uint8Array,
  onPageRendered: (pageNumber: number, totalPages: number, image: Blob) => void | Promise<void>,
  onProgress?: (pageNumber: number, totalPages: number) => void,
  scale = 2
): Promise<void> {
  initPdfWorker();
  let pdfDocument: any = null;

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
      cMapPacked: true,
    });
    pdfDocument = await loadingTask.promise;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is unavailable, so PDF pages cannot be rendered as images.');
    }

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const image = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`Could not encode PDF page ${pageNumber} as PNG.`));
        }, 'image/png');
      });

      await onPageRendered(pageNumber, pdfDocument.numPages, image);
      onProgress?.(pageNumber, pdfDocument.numPages);
      page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
      if (pageNumber % 2 === 0) {
        await yieldToMainThread(15);
      }
    }
  } finally {
    if (pdfDocument) {
      try {
        await pdfDocument.destroy();
      } catch {}
    }
  }
}

export interface ImagesToPdfOptions {
  orientation: 'auto' | 'portrait' | 'landscape';
  pageSize?: 'a4' | 'letter' | 'original' | 'fit-image';
  fit: 'contain' | 'cover' | 'original';
  margin: number;
}

/**
 * Convert multiple image files (JPG, PNG, WebP) into a single, clean PDF file entirely in the browser.
 */
export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // Standard sizes in points (72 points per inch)
  const SIZES = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612.0, height: 792.0 },
  };

  for (const file of files) {
    const arrayBuffer = await readSafeArrayBuffer(file);

    let embeddedImage;
    if (file.type === 'image/jpeg' || file.type === 'image/jpg' || /\.jpe?g$/i.test(file.name)) {
      try {
        embeddedImage = await pdf.embedJpg(arrayBuffer);
      } catch {
        // Fallback to canvas
      }
    } else if (file.type === 'image/png' || /\.png$/i.test(file.name)) {
      try {
        embeddedImage = await pdf.embedPng(arrayBuffer);
      } catch {
        // Fallback to canvas
      }
    }

    if (!embeddedImage) {
      // Fallback: draw image on canvas to get PNG bytes (handles webp, svg, or problematic jpg/png)
      try {
        const imgBitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = imgBitmap.width;
        canvas.height = imgBitmap.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(imgBitmap, 0, 0);
          const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
          if (pngBlob) {
            const pngBytes = await pngBlob.arrayBuffer();
            embeddedImage = await pdf.embedPng(pngBytes);
          }
        }
      } catch (canvasErr) {
        console.warn('Could not decode image via createImageBitmap, attempting fallback HTMLImageElement', canvasErr);
        // Secondary fallback using HTMLImageElement
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = dataUrl;
        });
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
          if (pngBlob) {
            const pngBytes = await pngBlob.arrayBuffer();
            embeddedImage = await pdf.embedPng(pngBytes);
          }
        }
      }
    }

    if (!embeddedImage) {
      throw new Error(`Failed to decode image: "${file.name}". Please ensure it is a valid JPG, PNG, or WebP image.`);
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    // Determine target page width and height
    let pageWidth: number;
    let pageHeight: number;

    const pageSizeChoice = options.pageSize || 'a4';

    if (pageSizeChoice === 'original' || pageSizeChoice === 'fit-image') {
      // Each page matches exact image dimensions plus margins
      pageWidth = imgWidth + options.margin * 2;
      pageHeight = imgHeight + options.margin * 2;
    } else {
      const base = pageSizeChoice === 'letter' ? SIZES.letter : SIZES.a4;
      
      let effectiveOrientation: 'portrait' | 'landscape';
      if (options.orientation === 'auto') {
        effectiveOrientation = imgWidth >= imgHeight ? 'landscape' : 'portrait';
      } else {
        effectiveOrientation = options.orientation;
      }

      if (effectiveOrientation === 'landscape') {
        pageWidth = Math.max(base.width, base.height);
        pageHeight = Math.min(base.width, base.height);
      } else {
        pageWidth = Math.min(base.width, base.height);
        pageHeight = Math.max(base.width, base.height);
      }
    }

    const page = pdf.addPage([pageWidth, pageHeight]);

    // Available drawable area
    const availWidth = Math.max(1, pageWidth - options.margin * 2);
    const availHeight = Math.max(1, pageHeight - options.margin * 2);

    let drawWidth: number;
    let drawHeight: number;

    if (options.fit === 'original') {
      drawWidth = imgWidth;
      drawHeight = imgHeight;
    } else if (options.fit === 'cover') {
      const scale = Math.max(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    } else {
      // Default: contain
      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      drawWidth = imgWidth * scale;
      drawHeight = imgHeight * scale;
    }

    const x = options.margin + (availWidth - drawWidth) / 2;
    const y = options.margin + (availHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });

    // Yield to event loop to allow GC
    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  return await pdf.save({ useObjectStreams: files.length < 20 });
}

export type CompressionPreset = 'low' | 'medium' | 'high' | 'custom';

export interface CompressPdfOptions {
  preset?: CompressionPreset;
  quality?: number; // 0.1 to 0.95 (e.g. 0.70)
  scale?: number; // 0.6 to 2.0 (e.g. 1.25)
  maxDimension?: number; // e.g. 1600 px
  grayscale?: boolean;
  mode?: 'deep' | 'lossless';
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * High-efficiency, memory-safe in-browser PDF compression.
 * Capable of drastically shrinking heavy scanned/image documents (e.g. 114MB -> 5-15MB)
 * through intelligent page raster downsampling, JPEG re-encoding, and object stream compression.
 */
export async function compressPdfFile(
  file: File,
  options: CompressPdfOptions = {}
): Promise<{ data: Uint8Array; originalSize: number; newSize: number; savedPercent: number }> {
  initPdfWorker();
  const originalSize = file.size;
  const preset = options.preset || 'low';

  // Determine compression parameters based on preset
  let quality = options.quality ?? 0.75;
  let scale = options.scale ?? 1.0;
  let maxDim = options.maxDimension ?? 1280;
  let grayscale = options.grayscale ?? false;
  let mode = options.mode ?? 'deep';

  if (preset === 'low') {
    quality = 0.78;
    scale = 1.0;
    maxDim = 1280;
    grayscale = false;
  } else if (preset === 'medium') {
    quality = 0.62;
    scale = 0.90;
    maxDim = 1050;
    grayscale = false;
  } else if (preset === 'high') {
    quality = 0.45;
    scale = 0.75;
    maxDim = 850;
    grayscale = false;
  }

  // 1. Fast stream & object compression pass first:
  // Runs in ~20-30ms using pdf-lib with useObjectStreams and metadata removal.
  let streamData: Uint8Array | null = null;
  let streamSavedPercent = 0;
  try {
    if (typeof Worker !== 'undefined') {
      streamData = await runPdfBackground('optimize', [file]);
    } else {
    let arrayBuffer: ArrayBuffer | null = null;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch {
      arrayBuffer = await readSafeArrayBuffer(file);
    }
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    arrayBuffer = null;
    pdf.setTitle('');
    pdf.setAuthor('');
    pdf.setSubject('');
    pdf.setKeywords([]);
    pdf.setProducer('ClickPDF Compression Engine');
    pdf.setCreator('ClickPDF');
    streamData = await pdf.save({ useObjectStreams: true, updateFieldAppearances: false });
    }
    streamSavedPercent = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - streamData.byteLength) / originalSize) * 100))
      : 0;
  } catch {
    // ignore
  }

  // Fast stream compression return:
  // When preset is 'low' (the default "High Quality (Crisp & Clear)") or 'lossless',
  // if stream optimization saved size, or if file is already small (<600KB),
  // return immediately in <30ms for blazing-fast speed!
  if (!grayscale && streamData && (mode === 'lossless' || preset === 'low')) {
    if (streamData.byteLength < originalSize || mode === 'lossless' || preset === 'low') {
      options.onProgress?.(1, 1, 'Optimized via fast stream compression');
      const optimized = streamData.byteLength < originalSize ? streamData : new Uint8Array(await readSafeArrayBuffer(file));
      return {
        data: optimized,
        originalSize,
        newSize: optimized.byteLength,
        savedPercent: streamSavedPercent,
      };
    }
  }

  // Do not retain both optimized bytes and a second rendered copy during deep compression.
  streamData = null;
  // Deep compression mode: process each page with lightweight offscreen canvas
  let pdfDoc: any = null;
  let blobUrl: string | null = null;

  try {
    // Prefer blob URL streaming to avoid copying giant ArrayBuffer into worker memory
    try {
      blobUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument({
        url: blobUrl,
        stopAtErrors: false,
      });
      pdfDoc = await loadingTask.promise;
    } catch {
      const arrayBuffer = await readSafeArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        stopAtErrors: false,
      });
      pdfDoc = await loadingTask.promise;
    }

    const numPages = pdfDoc.numPages;
    if (numPages === 0) {
      throw new Error('PDF contains no readable pages.');
    }

    const newPdf = await PDFDocument.create();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('HTML Canvas context unavailable in browser.');
    }

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const pct = Math.round((pageNum / numPages) * 100);
      options.onProgress?.(
        pageNum,
        numPages,
        `Compressing page ${pageNum} of ${numPages} (${pct}%)...`
      );

      const page = await pdfDoc.getPage(pageNum);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const ptsWidth = unscaledViewport.width;
      const ptsHeight = unscaledViewport.height;

      // Adjust scale to respect max dimension while keeping aspect ratio
      let targetScale = scale;
      const maxOriginalDim = Math.max(ptsWidth, ptsHeight);
      if (maxOriginalDim * targetScale > maxDim) {
        targetScale = maxDim / maxOriginalDim;
      }
      targetScale = Math.max(0.55, targetScale);

      const viewport = page.getViewport({ scale: targetScale });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      // Crisp solid white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (grayscale) {
        ctx.filter = 'grayscale(100%)';
      } else {
        ctx.filter = 'none';
      }

      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Convert page canvas to high-efficiency JPEG
      const blob: Blob | null = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });

      if (!blob) {
        throw new Error(`Failed to encode compressed page ${pageNum}`);
      }

      const jpgBuffer = await blob.arrayBuffer();
      const embeddedImg = await newPdf.embedJpg(new Uint8Array(jpgBuffer));

      // Recreate page with exact original dimensions in points
      const newPage = newPdf.addPage([ptsWidth, ptsHeight]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: ptsWidth,
        height: ptsHeight,
      });

      // Clear canvas context to prevent RAM ballooning
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        page.cleanup();
      } catch {
        // ignore
      }

      // Yield execution to browser event loop to allow GC of previous page buffer
      await yieldToMainThread(25);
    }

    // Release canvas allocations
    canvas.width = 0;
    canvas.height = 0;

    options.onProgress?.(numPages, numPages, 'Finalizing compressed document...');
    const data = await newPdf.save({ useObjectStreams: true });
    const newSize = data.byteLength;

    // Never increase file size or parse the original a third time just to undo
    // a deep-compression attempt that did not save space.
    if (newSize >= originalSize && originalSize > 0) {
      return { data: new Uint8Array(await readSafeArrayBuffer(file)), originalSize, newSize: originalSize, savedPercent: 0 };
    }

    const savedPercent = originalSize > 0 ? Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100)) : 0;
    return {
      data,
      originalSize,
      newSize,
      savedPercent,
    };
  } finally {
    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore
      }
    }
    if (pdfDoc) {
      try {
        await pdfDoc.destroy();
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Helper to inspect PDF metadata and page count.
 */
export async function inspectPdf(file: File): Promise<{ pageCount: number; title: string }> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    pageCount: pdf.getPageCount(),
    title: pdf.getTitle() || file.name.replace('.pdf', ''),
  };
}

export interface PdfTechnicalMetadata {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  pageCount: number;
  title: string | null;
  author: string | null;
  creator: string | null;
  producer: string | null;
  subject: string | null;
  keywords: string[];
  creationDate: string | null;
  creationDateIso: string | null;
  modificationDate: string | null;
  modificationDateIso: string | null;
  pdfVersion: string;
  isEncrypted: boolean;
  firstPageDimensions: {
    widthPoints: number;
    heightPoints: number;
    widthInches: number;
    heightInches: number;
    widthMm: number;
    heightMm: number;
    orientation: 'Portrait' | 'Landscape' | 'Square';
  } | null;
}

/**
 * Extract comprehensive technical metadata from a PDF entirely in-browser.
 */
export async function extractPdfMetadata(file: File): Promise<PdfTechnicalMetadata> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const uint8 = new Uint8Array(arrayBuffer);

  // Extract PDF specification version from binary header
  let pdfVersion = 'PDF 1.7';
  try {
    const headerSnippet = new TextDecoder().decode(uint8.subarray(0, Math.min(1024, uint8.length)));
    const match = headerSnippet.match(/%PDF-(\d+\.\d+)/);
    if (match) {
      pdfVersion = `PDF ${match[1]}`;
    }
  } catch {
    // fallback
  }

  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const pageCount = pdf.getPageCount();
  const title = pdf.getTitle() || null;
  const author = pdf.getAuthor() || null;
  const creator = pdf.getCreator() || null;
  const producer = pdf.getProducer() || null;
  const subject = pdf.getSubject() || null;
  const keywords = pdf.getKeywords() ? pdf.getKeywords()!.split(/[,;]\s*/).filter(Boolean) : [];

  const rawCreation = pdf.getCreationDate();
  const rawModification = pdf.getModificationDate();

  const creationDate = rawCreation ? rawCreation.toLocaleString() : null;
  const creationDateIso = rawCreation ? rawCreation.toISOString() : null;

  const modificationDate = rawModification ? rawModification.toLocaleString() : null;
  const modificationDateIso = rawModification ? rawModification.toISOString() : null;

  let firstPageDimensions: PdfTechnicalMetadata['firstPageDimensions'] = null;
  if (pageCount > 0) {
    try {
      const firstPage = pdf.getPage(0);
      const { width, height } = firstPage.getSize();
      const wInches = Number((width / 72).toFixed(2));
      const hInches = Number((height / 72).toFixed(2));
      const wMm = Math.round((width / 72) * 25.4);
      const hMm = Math.round((height / 72) * 25.4);
      const orientation = width > height ? 'Landscape' : width < height ? 'Portrait' : 'Square';

      firstPageDimensions = {
        widthPoints: Math.round(width),
        heightPoints: Math.round(height),
        widthInches: wInches,
        heightInches: hInches,
        widthMm: wMm,
        heightMm: hMm,
        orientation,
      };
    } catch {
      // ignore
    }
  }

  // Format file size
  const bytes = file.size;
  let fileSizeFormatted = `${bytes} B`;
  if (bytes >= 1048576) {
    fileSizeFormatted = `${(bytes / 1048576).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    fileSizeFormatted = `${(bytes / 1024).toFixed(1)} KB`;
  }

  return {
    fileName: file.name,
    fileSizeBytes: bytes,
    fileSizeFormatted,
    pageCount,
    title,
    author,
    creator,
    producer,
    subject,
    keywords,
    creationDate,
    creationDateIso,
    modificationDate,
    modificationDateIso,
    pdfVersion,
    isEncrypted: pdf.isEncrypted,
    firstPageDimensions,
  };
}

/**
 * Remove all technical metadata (Author, Producer, Creator, Title) for total privacy.
 */
export async function sanitizePdfMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  pdf.setTitle('');
  pdf.setAuthor('');
  pdf.setSubject('');
  pdf.setKeywords([]);
  pdf.setProducer('');
  pdf.setCreator('');

  return await pdf.save();
}

export interface UpdatePdfMetadataPayload {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * Update and modify essential PDF metadata fields (Title, Author, Subject, Keywords, Creator, Producer)
 * directly in the browser using pdf-lib.
 */
export async function updatePdfMetadata(
  file: File,
  payload: UpdatePdfMetadataPayload
): Promise<Uint8Array> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  if (payload.title !== undefined) pdf.setTitle(payload.title);
  if (payload.author !== undefined) pdf.setAuthor(payload.author);
  if (payload.subject !== undefined) pdf.setSubject(payload.subject);
  if (payload.keywords !== undefined) pdf.setKeywords(payload.keywords);
  if (payload.creator !== undefined) pdf.setCreator(payload.creator);
  if (payload.producer !== undefined) pdf.setProducer(payload.producer);
  if (payload.creationDate !== undefined) pdf.setCreationDate(payload.creationDate);
  if (payload.modificationDate !== undefined) pdf.setModificationDate(payload.modificationDate);

  return await pdf.save();
}

export interface PageBreakdownItem {
  pageNumber: number;
  widthPoints: number;
  heightPoints: number;
  widthMm: number;
  heightMm: number;
  widthInches: number;
  heightInches: number;
  orientation: 'Portrait' | 'Landscape' | 'Square';
  paperFormat: string;
  aspectRatio: string;
}

export interface PdfPageCountAnalysis {
  totalPages: number;
  portraitCount: number;
  landscapeCount: number;
  squareCount: number;
  evenPagesCount: number;
  oddPagesCount: number;
  estimatedReadTimeMinutes: number;
  duplexSheetsRequired: number;
  simplexSheetsRequired: number;
  isUniformDimensions: boolean;
  primaryPaperFormat: string;
  pages: PageBreakdownItem[];
}

function detectPaperFormat(width: number, height: number): string {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);

  // A4: 595.28 x 841.89
  if (Math.abs(shortSide - 595.28) < 6 && Math.abs(longSide - 841.89) < 6) return 'A4';
  // US Letter: 612 x 792
  if (Math.abs(shortSide - 612) < 6 && Math.abs(longSide - 792) < 6) return 'US Letter';
  // US Legal: 612 x 1008
  if (Math.abs(shortSide - 612) < 6 && Math.abs(longSide - 1008) < 6) return 'US Legal';
  // A3: 841.89 x 1190.55
  if (Math.abs(shortSide - 841.89) < 8 && Math.abs(longSide - 1190.55) < 8) return 'A3';
  // A5: 419.53 x 595.28
  if (Math.abs(shortSide - 419.53) < 6 && Math.abs(longSide - 595.28) < 6) return 'A5';
  // Tabloid / Ledger: 792 x 1224
  if (Math.abs(shortSide - 792) < 6 && Math.abs(longSide - 1224) < 6) return 'Tabloid';

  return 'Custom';
}

/**
 * Utility to count the total number of pages and inspect page structure in a user-uploaded PDF file.
 */
export async function countPdfPages(file: File): Promise<PdfPageCountAnalysis> {
  const arrayBuffer = await readSafeArrayBuffer(file);
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pdfPages = pdf.getPages();
  const totalPages = pdfPages.length;

  let portraitCount = 0;
  let landscapeCount = 0;
  let squareCount = 0;
  let firstW = 0;
  let firstH = 0;
  let isUniform = true;

  const formatCounts: Record<string, number> = {};

  const pages: PageBreakdownItem[] = pdfPages.map((page, index) => {
    const pageNumber = index + 1;
    const { width, height } = page.getSize();
    const w = Math.round(width);
    const h = Math.round(height);

    if (index === 0) {
      firstW = w;
      firstH = h;
    } else if (w !== firstW || h !== firstH) {
      isUniform = false;
    }

    const orientation: 'Portrait' | 'Landscape' | 'Square' =
      w > h ? 'Landscape' : w < h ? 'Portrait' : 'Square';

    if (orientation === 'Portrait') portraitCount++;
    else if (orientation === 'Landscape') landscapeCount++;
    else squareCount++;

    const paperFormat = detectPaperFormat(width, height);
    formatCounts[paperFormat] = (formatCounts[paperFormat] || 0) + 1;

    const wMm = Math.round((width / 72) * 25.4);
    const hMm = Math.round((height / 72) * 25.4);
    const wInches = Number((width / 72).toFixed(2));
    const hInches = Number((height / 72).toFixed(2));
    const gcdVal = (a: number, b: number): number => (b === 0 ? a : gcdVal(b, a % b));
    const simpleGcd = gcdVal(w, h);
    const aspectRatio = simpleGcd > 1 ? `${Math.round(w / simpleGcd)}:${Math.round(h / simpleGcd)}` : `${(w / h).toFixed(2)}:1`;

    return {
      pageNumber,
      widthPoints: w,
      heightPoints: h,
      widthMm: wMm,
      heightMm: hMm,
      widthInches: wInches,
      heightInches: hInches,
      orientation,
      paperFormat,
      aspectRatio,
    };
  });

  let primaryPaperFormat = 'Custom';
  let maxFormatCount = 0;
  for (const [fmt, cnt] of Object.entries(formatCounts)) {
    if (cnt > maxFormatCount) {
      maxFormatCount = cnt;
      primaryPaperFormat = fmt;
    }
  }

  const evenPagesCount = Math.floor(totalPages / 2);
  const oddPagesCount = Math.ceil(totalPages / 2);
  const duplexSheetsRequired = Math.ceil(totalPages / 2);
  const simplexSheetsRequired = totalPages;
  const estimatedReadTimeMinutes = Math.max(1, Math.round(totalPages * 1.5));

  return {
    totalPages,
    portraitCount,
    landscapeCount,
    squareCount,
    evenPagesCount,
    oddPagesCount,
    estimatedReadTimeMinutes,
    duplexSheetsRequired,
    simplexSheetsRequired,
    isUniformDimensions: isUniform,
    primaryPaperFormat,
    pages,
  };
}

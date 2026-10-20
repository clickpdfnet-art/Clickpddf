import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { initPdfWorker } from './pdfWorkerSetup';

// Initialize safe worker
initPdfWorker();

/**
 * Load PDF document once and render page thumbnails in parallel/batch
 */
export async function renderAllPageThumbnails(
  file: File,
  targetWidth = 220,
  onProgress?: (rendered: number, total: number) => void,
  onPageRendered?: (pageNum: number, dataUrl: string) => void
): Promise<Map<number, string>> {
  const thumbnails = new Map<number, string>();
  let blobUrl: string | null = null;
  try {
    initPdfWorker();
    let pdfDoc: any = null;

    try {
      blobUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument({
        url: blobUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
      });
      pdfDoc = await loadingTask.promise;
    } catch {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
      });
      pdfDoc = await loadingTask.promise;
    }

    const numPages = pdfDoc.numPages;
    // Render thumbnails progressively for all pages
    const maxPagesToRender = numPages;

    for (let pageNum = 1; pageNum <= maxPagesToRender; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(targetWidth / (viewport.width || 1), 1);
        const scaledViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        const context = canvas.getContext('2d');

        if (context) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          await (page.render as any)({
            canvasContext: context,
            viewport: scaledViewport,
            canvas: canvas,
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          thumbnails.set(pageNum, dataUrl);
          if (onPageRendered) {
            try {
              onPageRendered(pageNum, dataUrl);
            } catch {}
          }

          // Clear canvas memory
          canvas.width = 0;
          canvas.height = 0;
        }
      } catch (pageErr) {
        console.warn(`Failed rendering thumbnail for page ${pageNum}:`, pageErr);
      }

      if (onProgress) {
        onProgress(pageNum, numPages);
      }

      // Yield event loop every 2 pages to keep browser tab responsive
      if (pageNum % 2 === 0) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }
  } catch (err) {
    console.warn('Could not render PDF thumbnails with pdfjs-dist:', err);
  } finally {
    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  }

  return thumbnails;
}

/**
 * Render a single page thumbnail as JPEG data URL.
 */
export async function renderPdfPageThumbnail(
  file: File,
  pageNumber = 1,
  targetWidth = 320
): Promise<string | null> {
  let blobUrl: string | null = null;
  try {
    initPdfWorker();
    let pdfDoc: any = null;

    try {
      blobUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument({
        url: blobUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
      });
      pdfDoc = await loadingTask.promise;
    } catch {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.4.299/cmaps/',
        cMapPacked: true,
      });
      pdfDoc = await loadingTask.promise;
    }

    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) return null;

    const page = await pdfDoc.getPage(pageNumber);
    const originalViewport = page.getViewport({ scale: 1.0 });
    const scale = targetWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } catch (err) {
    console.warn('Failed rendering single PDF page thumbnail:', err);
    return null;
  } finally {
    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {}
    }
  }
}

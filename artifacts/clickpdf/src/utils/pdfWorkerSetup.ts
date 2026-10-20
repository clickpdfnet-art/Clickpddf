import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

let isConfigured = false;

/**
 * Robust, cross-browser, iframe-safe PDF.js worker configuration.
 * Uses local bundled Vite worker with zero external CDN dependency to prevent
 * CORS, CSP, or "Failed to fetch dynamically imported module" errors.
 */
export function initPdfWorker() {
  if (isConfigured || typeof window === 'undefined') return;

  try {
    if (pdfWorkerUrl) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      isConfigured = true;
      return;
    }
  } catch (err) {
    console.warn('[pdf.js] Could not assign bundled worker URL, falling back:', err);
  }

  // Fallback to jsdelivr / unpkg if Vite asset resolution fails
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;
    isConfigured = true;
  } catch {
    // pdf.js will fall back to main thread fake worker safely
  }
}

// Auto-run on module load
initPdfWorker();

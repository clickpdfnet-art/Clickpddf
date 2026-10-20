export function wordAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('PDF to Word conversion cancelled. No incomplete DOCX was downloaded.', 'AbortError');
}
export async function wordAbortable<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  wordAbort(signal);
  if (!signal) return promise;
  let listener: () => void = () => {};
  try {
    return await Promise.race([promise, new Promise<never>((_, reject) => {
      listener = () => reject(new DOMException('Conversion cancelled.', 'AbortError'));
      signal.addEventListener('abort', listener, { once: true });
    })]);
  } finally { signal.removeEventListener('abort', listener); }
}
export interface WordBrowserFeatures {
  worker: boolean; wasm: boolean; blob: boolean; objectUrl: boolean; arrayBuffer: boolean; canvas: boolean; cache: boolean;
}
export function inspectWordBrowser(): WordBrowserFeatures {
  const canvas = typeof document !== 'undefined' && !!document.createElement('canvas').getContext('2d');
  let wasm = false;
  try { wasm = typeof WebAssembly === 'object' && WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])); } catch { /* missing or disallowed */ }
  return { worker: typeof Worker !== 'undefined', wasm, blob: typeof Blob !== 'undefined',
    objectUrl: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof URL.revokeObjectURL === 'function',
    arrayBuffer: typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer === 'function',
    canvas, cache: typeof caches !== 'undefined' };
}
export function validateWordBrowser(features: WordBrowserFeatures, ocr: boolean) {
  const required: [keyof WordBrowserFeatures, string][] = [['worker', 'Web Workers'], ['blob', 'Blob files'],
    ['objectUrl', 'Blob download URLs'], ['arrayBuffer', 'ArrayBuffer file reading'], ['canvas', 'Canvas 2D']];
  if (ocr) required.push(['wasm', 'WebAssembly (disable OCR to keep selectable-text extraction)']);
  const missing = required.filter(([key]) => !features[key]).map(([, name]) => name);
  if (missing.length) throw new Error(`This browser is missing required PDF-to-Word capabilities: ${missing.join(', ')}. No PDF data was uploaded.`);
}
export function wordRenderScale(width: number, height: number, requested = 2, maxPixels = 6_000_000, maxDimension = 4096) {
  return Math.min(requested, Math.sqrt(maxPixels / Math.max(1, width * height)), maxDimension / Math.max(width, height, 1));
}

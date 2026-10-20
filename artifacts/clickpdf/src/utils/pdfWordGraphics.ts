import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { WordArtwork } from './pdfWordTypes';
import { wordAbort, wordRenderScale } from './pdfWordRuntimeChecks';
export interface WordOperators { fnArray: number[]; argsArray: any[][] }

export async function canvasPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Could not encode PDF artwork.')), 'image/png'));
  return new Uint8Array(await blob.arrayBuffer());
}

export async function renderWordPage(page: pdfjs.PDFPageProxy, scale = 1.5, signal?: AbortSignal, maxPixels = 6_000_000) {
  wordAbort(signal);
  const original = page.getViewport({ scale: 1 });
  scale = wordRenderScale(original.width, original.height, scale, maxPixels);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable for PDF images.');
  const render = page.render({ canvas, canvasContext: context, viewport, annotationMode: pdfjs.AnnotationMode.DISABLE });
  const cancel = () => render.cancel();
  signal?.addEventListener('abort', cancel, { once: true });
  try { await render.promise; wordAbort(signal); return canvas; }
  catch (error) { canvas.width = canvas.height = 0; wordAbort(signal); throw error; }
  finally { signal?.removeEventListener('abort', cancel); }
}

function occupiedBounds(canvas: HTMLCanvasElement, whiteIsEmpty = false) {
  const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
  let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const index = (y * canvas.width + x) * 4;
    if (pixels[index + 3] > 10 && (!whiteIsEmpty || Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) < 245)) {
      left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
    }
  }
  return right > left && bottom > top ? [left, top, right, bottom] : null;
}

export async function cropArtwork(canvas: HTMLCanvasElement, bounds: number[], scale: number, role: WordArtwork['role']): Promise<WordArtwork | null> {
  const [left, top, right, bottom] = bounds.map(Math.round);
  if (right <= left || bottom <= top) return null;
  const crop = document.createElement('canvas');
  crop.width = right - left; crop.height = bottom - top;
  crop.getContext('2d')!.drawImage(canvas, left, top, crop.width, crop.height, 0, 0, crop.width, crop.height);
  try { return { data: await canvasPng(crop), x: left / scale, y: top / scale, width: crop.width / scale, height: crop.height / scale, role }; }
  finally { crop.width = crop.height = 0; }
}

/** Render only artwork operations: selectable text is never baked into these layers. */
export async function extractWordArtwork(page: pdfjs.PDFPageProxy, operators: WordOperators, warnings: string[], signal?: AbortSignal, maxPixels = 6_000_000): Promise<WordArtwork[]> {
  const ops = pdfjs.OPS;
  const textPaint = new Set([ops.showText, ops.showSpacedText, ops.nextLineShowText, ops.nextLineSetSpacingShowText]);
  const imagePaint = new Set([ops.paintImageXObject, ops.paintInlineImageXObject, ops.paintImageMaskXObject, ops.paintImageXObjectRepeat,
    ops.paintImageMaskXObjectRepeat, ops.paintImageMaskXObjectGroup, ops.paintInlineImageXObjectGroup, ops.paintSolidColorImageMask]);
  const pathPaint = new Set([ops.stroke, ops.closeStroke, ops.fill, ops.eoFill, ops.fillStroke, ops.eoFillStroke, ops.closeFillStroke, ops.closeEOFillStroke, ops.shadingFill, ops.constructPath]);
  const simpleImages = new Set([ops.paintImageXObject, ops.paintInlineImageXObject, ops.paintImageMaskXObject]);
  const hasComplexImages = operators.fnArray.some(op => imagePaint.has(op) && !simpleImages.has(op));
  const result: WordArtwork[] = [];
  wordAbort(signal);
  const base = page.getViewport({ scale: 1 });
  const scale = wordRenderScale(base.width, base.height, 1.5, maxPixels), viewport = page.getViewport({ scale });
  const imageBoxes: number[][] = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  for (let index = 0; index < operators.fnArray.length; index++) {
    const op = operators.fnArray[index], args = operators.argsArray[index];
    if (op === ops.save || op === ops.paintFormXObjectBegin) {
      stack.push([...matrix]);
      if (op === ops.paintFormXObjectBegin && args?.[0]) matrix = pdfjs.Util.transform(matrix, args[0]);
    } else if (op === ops.restore || op === ops.paintFormXObjectEnd) matrix = stack.pop() || matrix;
    else if (op === ops.transform) matrix = pdfjs.Util.transform(matrix, args);
    else if (op === ops.paintImageXObject || op === ops.paintInlineImageXObject || op === ops.paintImageMaskXObject) {
      const combined = pdfjs.Util.transform(viewport.transform, matrix);
      const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) =>
        [combined[0] * x + combined[2] * y + combined[4], combined[1] * x + combined[3] * y + combined[5]]);
      imageBoxes.push([Math.max(0, Math.min(...corners.map(point => point[0]))), Math.max(0, Math.min(...corners.map(point => point[1]))),
        Math.min(viewport.width, Math.max(...corners.map(point => point[0]))), Math.min(viewport.height, Math.max(...corners.map(point => point[1])))]);
    }
  }
  // Merge overlaps so the same visible pixels cannot be duplicated by overlapping crops.
  for (let a = 0; a < imageBoxes.length; a++) for (let b = a + 1; b < imageBoxes.length; b++) {
    const x = imageBoxes[a], y = imageBoxes[b];
    if (x[0] <= y[2] && x[2] >= y[0] && x[1] <= y[3] && x[3] >= y[1]) {
      imageBoxes[a] = [Math.min(x[0], y[0]), Math.min(x[1], y[1]), Math.max(x[2], y[2]), Math.max(x[3], y[3])];
      imageBoxes.splice(b, 1);
      b = a; // The union can now overlap an earlier candidate: rescan to closure.
    }
  }
  for (const layer of ['image', 'artwork'] as const) {
    const present = operators.fnArray.some(op => (layer === 'image' ? imagePaint : pathPaint).has(op));
    if (!present) continue;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d')!;
    try {
      wordAbort(signal);
      const render = page.render({ canvas, canvasContext: context, viewport, background: 'rgba(0,0,0,0)', annotationMode: pdfjs.AnnotationMode.DISABLE,
        operationsFilter: (index, list) => {
          const op = list.fnArray[index];
          if (textPaint.has(op)) return false;
          return layer === 'image' ? !pathPaint.has(op) : !imagePaint.has(op);
        }
      });
      const cancel = () => render.cancel();
      signal?.addEventListener('abort', cancel, { once: true });
      try { await render.promise; wordAbort(signal); }
      finally { signal?.removeEventListener('abort', cancel); }
      const occupied = occupiedBounds(canvas);
      if (!occupied) {
        if (layer === 'image') warnings.push('Image operators produced no visible pixels (transparent, empty or unsupported image data). Compare these regions with the original PDF.');
        continue;
      }
      const boxes = layer === 'image' && imageBoxes.length && !hasComplexImages ? imageBoxes : [occupied];
      for (const box of boxes) {
        const artwork = await cropArtwork(canvas, box, scale, layer);
        if (artwork) result.push(artwork);
      }
      if (layer === 'artwork') warnings.push('Vector borders, fills, diagrams and chart artwork are preserved as a non-text PNG layer, not editable Word shapes.');
      if (layer === 'image' && (!imageBoxes.length || hasComplexImages)) warnings.push('Complex image groups are retained as a combined artwork region rather than individually editable images.');
    } finally { canvas.width = canvas.height = 0; }
  }
  if (operators.fnArray.some(op => op === ops.clip || op === ops.eoClip)) warnings.push('Complex clipping and transparency may differ in reconstructed artwork.');
  return result;
}

export async function remainingScanArtwork(canvas: HTMLCanvasElement, scale: number) {
  const bounds = occupiedBounds(canvas, true);
  return bounds ? cropArtwork(canvas, bounds, scale, 'artwork') : null;
}
export function hasVisibleScanContent(canvas: HTMLCanvasElement) {
  return occupiedBounds(canvas, true) !== null;
}

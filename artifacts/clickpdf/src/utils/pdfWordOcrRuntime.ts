import type { Worker as OcrWorker } from 'tesseract.js';
import workerUrl from 'tesseract.js/dist/worker.min.js?url';
import coreUrl from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import { validateWordLanguages, wordModelUrl } from './pdfWordLanguages';
import { wordAbort, wordAbortable } from './pdfWordRuntimeChecks';

const MODEL_CACHE = 'clickpdf-word-models-tessdata-4-validated-v1';
export function wordOcrAssets(base = location.href) {
  const worker = new URL(workerUrl, base), core = new URL(coreUrl, base);
  if (worker.origin !== new URL(base).origin || core.origin !== new URL(base).origin)
    throw new Error('PDF-to-Word OCR worker/core must use same-origin bundled assets.');
  return { workerPath: worker.href, corePath: core.href };
}
function validModel(bytes: Uint8Array) {
  // The engine performs semantic traineddata validation. Do not cache its data before that succeeds.
  return bytes.length > 1024 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}
async function modelBytes(id: string, signal: AbortSignal | undefined, status: (message: string) => void) {
  const url = wordModelUrl(id);
  let cache: Cache | undefined;
  try { if (typeof caches !== 'undefined') cache = await caches.open(MODEL_CACHE); }
  catch { status('Model cache unavailable (private mode/quota); using temporary browser memory.'); }
  if (cache) {
    const saved = await cache.match(url);
    if (saved) {
      const bytes = new Uint8Array(await wordAbortable(saved.arrayBuffer(), signal));
      if (validModel(bytes)) { status(`Using cached ${id} model (tessdata 4.0.0, ${(bytes.length / 1048576).toFixed(1)} MB).`); return { bytes, cache, url, cached: true }; }
      await cache.delete(url);
    }
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    wordAbort(signal);
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!response.ok) throw new Error(`Model ${id} is unavailable (HTTP ${response.status}); no other language was substituted.`);
    const size = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let downloaded = 0;
    if (reader) {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        chunks.push(next.value); downloaded += next.value.length;
        status(`Loading ${id} OCR model 4.0.0: ${(downloaded / 1048576).toFixed(1)} MB${size ? ` / ${(size / 1048576).toFixed(1)} MB (${Math.round(downloaded / size * 100)}%)` : ' (total size not supplied)'}`);
      }
    } else { const bytes = new Uint8Array(await response.arrayBuffer()); chunks.push(bytes); downloaded = bytes.length; }
    const bytes = new Uint8Array(downloaded); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    if (!validModel(bytes)) throw new Error(`Model ${id} did not contain valid compressed traineddata. It was not cached.`);
    return { bytes, cache, url, cached: false };
  } catch (error: any) {
    wordAbort(signal);
    throw new Error(`Could not load selected OCR model "${id}" (offline, blocked host, timeout, corrupt data or memory limit): ${error?.message || error}`);
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
}
export async function createWordOcrWorker(ids: string[], signal: AbortSignal | undefined, status: (message: string) => void): Promise<OcrWorker> {
  validateWordLanguages(ids); wordAbort(signal);
  const assets = wordOcrAssets();
  for (const [kind, url] of Object.entries(assets)) {
    const response = await wordAbortable(fetch(url, { method: 'HEAD', signal }), signal);
    if (!response.ok) throw new Error(`Bundled OCR ${kind} asset is unreachable (HTTP ${response.status}). No PDF was uploaded.`);
  }
  const models: Awaited<ReturnType<typeof modelBytes>>[] & { id?: never } = [];
  for (const id of ids) models.push({ id, ...await modelBytes(id, signal, status) });
  wordAbort(signal);
  const { default: Tesseract } = await import('tesseract.js');
  const pending = Tesseract.createWorker(models.map(model => ({ code: model.id, data: model.bytes })), 1, {
    ...assets, workerBlobURL: false, cacheMethod: 'none',
    logger: message => status(`${message.status}${typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : ''}`),
    errorHandler: () => { /* The SDK's rejected job is handled by the caller. */ }
  });
  // If cancellation wins worker initialization, terminate the late worker as soon as it becomes available.
  void pending.then(worker => { if (signal?.aborted) void worker.terminate().catch(() => {}); }, () => {});
  let worker: OcrWorker;
  try { worker = await wordAbortable(pending, signal); }
  catch (error) {
    for (const model of models) if (model.cached) await model.cache?.delete(model.url).catch(() => {});
    throw error;
  }
  try {
    for (const model of models) if (!model.cached && model.cache) {
      wordAbort(signal);
      try { await model.cache.put(model.url, new Response(new Blob([model.bytes as BlobPart]), { headers: { 'Content-Type': 'application/gzip' } })); }
      catch { status(`Model ${model.id} loaded, but the browser refused cache storage; it remains temporary.`); }
    }
    wordAbort(signal);
    return worker;
  } catch (error) { await worker.terminate().catch(() => {}); throw error; }
}
